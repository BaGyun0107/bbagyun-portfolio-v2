<?php
require_once $_SERVER['DOCUMENT_ROOT'] . "/CODI.common.min.api.php";
require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";

// 시작 시간 측정
$startTime = $_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true);

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ServerException;

// 허용된 도메인 목록
$allowed_domains = [];
$origin = $_SERVER['HTTP_ORIGIN'];

// localhost:3000 은 도메인에 v1, v2가 포함되었을 경우만 allowed_domains에 포함되도록 설정
if (strpos($origin, 'localhost') !== false) {
    $allowed_domains[] = 'http://localhost:3000';
}

// 요청 도메인이 co-di 일 경우에만 허용
if (strpos($origin, 'thesiena') !== false) {
    $allowed_domains[] = $origin;
}

if (in_array($origin, $allowed_domains)) {
    header('Access-Control-Allow-Origin: ' . $origin);

    if (strpos($origin, '://www.') === false) {
        // 만약 www가 안 붙어있으면, 붙인 버전도 추가
        $allowed_domains[] = preg_replace('/^(https?:\/\/)(.+)$/', '$1www.$2', $origin);
    } else {
        // 이미 www가 붙어있으면, 제거한 버전도 추가
        $allowed_domains[] = preg_replace('/^(https?:\/\/)www\.(.+)$/', '$1$2', $origin);
    }
}

// 서버 헤더 설정
header('Content-Type: application/json');
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight 요청에 대한 응답
    header('HTTP/1.1 200 OK');
    exit();
}

$data = json_decode(file_get_contents('php://input'));

if (!$data) {
  errorJsonResponse(999, 'No Post Data');
  die();
}

// header Authorization 값 추출 함수
function getAuthorizationHeader(){
    $headers = null;

    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    }
    else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx 혹은 FastCGI
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } else if (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        // 서버에 따라 대소문자가 다를 수 있음
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

$authorization = getAuthorizationHeader();

if (!$authorization) {
    errorJsonResponse(9999, '검증 실패');
    die();
}

// $testKey = '1F1B4DA96A8E7E1748B7E6F61F61F82DE0CA5F816A764A85BF0C0A465D46E551';
// 암호화된 데이터 복호화
$encryption_key = hex2bin($rsConfig->getKey('ENCRYPTKEY'));

$encryptedAuth = $authorization;
list($authEncodedIv, $authEncodedEncrypted) = explode('.', $encryptedAuth);
$authEncryption_iv = base64_decode(urldecode($authEncodedIv));
$authEncrypted = base64_decode(urldecode($authEncodedEncrypted));
$authDecrypted = openssl_decrypt($authEncrypted, 'AES-256-CBC', $encryption_key, OPENSSL_RAW_DATA, $authEncryption_iv);
$authDecoded = json_decode($authDecrypted, true);

// localhost 일 경우 데이터 복호화 하지 않음
if (strpos($origin, 'localhost') === false) {
    if (is_string($data)) {
        list($dataEncodedIv, $dataEncodedEncrypted) = explode('.', $data);

        if (isset($dataEncodedIv) && isset($dataEncodedEncrypted) && $dataEncodedIv !== '' && $dataEncodedEncrypted !== '') {
            $dataEncryption_iv = base64_decode(urldecode($dataEncodedIv));
            $dataEncrypted = base64_decode(urldecode($dataEncodedEncrypted));
            $dataDecrypted = openssl_decrypt($dataEncrypted, 'AES-256-CBC', $encryption_key, OPENSSL_RAW_DATA, $dataEncryption_iv);
            $data = json_decode($dataDecrypted);
        }
    }
}

if($authDecoded != $rsConfig->getKey('PROXY_KEY')) {
    errorJsonResponse(999, '검증 실패');
    die();
}

$url = isset($data->url) ? $data->url : '';
$urlType = isset($data->urlType) ? $data->urlType : '';
$method = isset($data->method) ? $data->method : '';
$payload = $data->data;
$logYn = isset($data->logYn) ? $data->logYn : false;

if (!$url || !$urlType || !$method) {
    errorJsonResponse(999, '필수 값 누락');
    die();
}

$client = new Client();

// 기본 헤더 설정
$headers = [
    'Accept' => 'application/json',
    'Content-Type' => 'application/json'
];

$getHeaders = $rsConfig->getAuthorizationKey($urlType, $payload->platform);

if ($urlType === 'daol') {
    // errorlog 에 출력
    $headers = array_merge($headers, $getHeaders);
} else {
    $headers = array_merge($headers, $getHeaders);
}

try {
    // 필요한 쿠키만 전달
    $cookie_keys = array('accessToken', 'mb_id', 'autoLogin', 'Authorization');

    if ($urlType === 'vx') {
        $golfCourseCode = $rsConfig->getVxGolfCourseKeyByPlatform($payload->data->platform);
        $payload->header->glfCrsCd = $golfCourseCode;
    }

    // payload 에 platform 값 제거
    if (isset($payload->platform) && $urlType !== 'gnu') {
        unset($payload->platform);
    }


    $resp = [];
    if ($urlType === 'gnu') {
        // GET 요청이라면
        if ($method === 'GET' && !empty((array)$payload)) {
            $_GET = (array)$payload;
        }

        // POST 요청이라면
        if ($method === 'POST' && !empty((array)$payload)) {
            $_POST = (array)$payload;
        }

        // 만약 url 에 https://thesiena.co.kr 이 포함되어있다면 '' 로 변경
        if (strpos($url, 'https://thesiena.co.kr') !== false) {
            $url = str_replace('https://thesiena.co.kr', '', $url);
        }

        ob_start();

        include $_SERVER['DOCUMENT_ROOT'] . $url;
    }else {
        $resp = http_request(
            $method,
            $url,
            $headers,
            $payload,
            array(
                'timeout' => 30,
                'cookie_keys' => $cookie_keys,
                'decode_json' => false // 기존처럼 원문 body 그대로 echo 할 경우
            )
        );
    }

    // 에러 체크 추가
    if ( !isset($resp) || empty($resp) || !isset($resp['body']) || empty($resp['body']) ) {
        // 오류 디버깅
        errorJsonResponse($resp['status'], '서버 오류 발생');
        die();
    }

    // 다운스트림 Set-Cookie 전달
    if (!empty($resp['set_cookie_headers'])) {
        foreach ($resp['set_cookie_headers'] as $cookie) {
            header('Set-Cookie: ' . $cookie, false);
        }
    }

    // // 상태코드 전달(선택)
    // http_response_code($resp['status']);

    if ($logYn) {
        createLogFile($payload, $resp, $url);
    }

    // 최종 응답 반환(기존 동작 유지)
    echo $resp['body'];

    // 종료 시간 측정
    $endTime = microtime(true);
    $executionTime = $endTime - $startTime;
    if ($executionTime > 4) {
        logSlowRequest($payload, $resp, $url, $executionTime);
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    die();
} catch (ConnectException $e) {
    errorJsonResponse(500, '네트워크 연결 오류: ' . $e->getMessage());
} catch (ClientException $e) {
    errorJsonResponse($e->getResponse()->getStatusCode(), '클라이언트 오류: ' . $e->getMessage());
} catch (ServerException $e) {
    errorJsonResponse($e->getResponse()->getStatusCode(), '서버 오류: ' . $e->getMessage());
} catch (RequestException $e) {
    if ($e->hasResponse()) {
        echo $e->getResponse()->getBody()->getContents();
    } else {
        errorJsonResponse(500, '요청 오류: ' . $e->getMessage());
    }
} catch (\Exception $e) {
    errorJsonResponse(500, '예기치 않은 오류: ' . $e->getMessage());
}

/**
 * 로그 파일 생성 함수
 * 기존 가독성을 유지하면서 성능 개선
 *
 * @param object $requestData 요청 데이터
 * @param array $responseData 응답 데이터
 * @param string $url 요청 URL
 */
function createLogFile($requestData, $responseData, $url) {
    static $logger = null;

    if ($logger === null) {
        $logger = new ReadableLogger();
    }

    $logger->log($requestData, $responseData, $url);
}

/**
 * 가독성 있는 로거 클래스
 * 기존 방식과 유사하지만 성능 개선 적용
 */
class ReadableLogger {
    private $buffer = [];
    private $bufferSize = 20; // 20개씩 배치 처리 (빈번한 플러시로 실시간성 확보)
    private $flushInterval = 2; // 2초마다 강제 플러시
    private $lastFlush;
    // private $logDirectory;

    public function __construct() {
        $this->lastFlush = time();
        // $this->logDirectory = $_SERVER['DOCUMENT_ROOT'] . '/log';

        // 스크립트 종료 시 자동 플러시
        register_shutdown_function([$this, 'flush']);

        // // 디렉토리 초기화
        // $this->initLogDirectory();
    }

    public function log($requestData, $responseData, $url) {
        $currentDate = date('Y-m-d');
        $currentHour = date('H');
        $currentTime = date('H:i:s');
        $currentMonth = date('m'); // 월 정보 추가
        $status = isset($responseData['status']) ? $responseData['status'] : 500;

        // 로그 엔트리 생성 (기존 방식과 동일한 가독성)
        $logEntry = [
            'timestamp' => microtime(true),
            'date' => $currentDate,
            'hour' => $currentHour,
            'time' => $currentTime,
            'month' => $currentMonth, // 월 정보 추가
            'url' => $url,
            'status' => $status,
            'type' => ($status != 0 && $status != 200) ? 'error' : 'success',
            'request_data' => $requestData,
            'response_data' => isset($responseData['body']) ?
                json_decode($responseData['body'], true) : $reponseData
        ];

        $this->buffer[] = $logEntry;

        // 버퍼 플러시 조건 체크 (더 빈번한 플러시)
        if (count($this->buffer) >= $this->bufferSize ||
            (time() - $this->lastFlush) >= $this->flushInterval) {
            $this->flush();
        }
    }

    public function flush() {
        if (empty($this->buffer)) return;

        try {
            // 년월/월/파일명 별로 그룹화
            $grouped = [];
            foreach ($this->buffer as $entry) {
                $yearMonth = date('Ym', $entry['timestamp']);     // 202509
                $month = $entry['month'];                         // 09
                $dateHour = $entry['date'] . '_' . $entry['hour'];
                $grouped[$yearMonth][$month][$dateHour][$entry['type']][] = $entry;
            }

            // 배치로 파일에 쓰기
            foreach ($grouped as $yearMonth => $months) {
                foreach ($months as $month => $dateHours) {
                    $this->writeBatchLogs($yearMonth, $month, $dateHours);
                }
            }

            $this->buffer = [];
            $this->lastFlush = time();

        } catch (Exception $e) {
            error_log("로그 플러시 실패: " . $e->getMessage());
        }
    }

    private function writeBatchLogs($yearMonth, $month, $dateHours) {
        // // /log/202509/09/ 형태의 디렉토리 구조 생성
        // $logDirYm = $this->logDirectory . '/' . $yearMonth;           // /log/202509
        // $logDirMonth = $logDirYm . '/' . $month;                     // /log/202509/09

        openlog('myapi', LOG_PID | LOG_NDELAY, LOG_LOCAL0);

        // // 년월 디렉토리 생성
        // if (!file_exists($logDirYm)) {
        //     mkdir($logDirYm, 0707, true);
        //     chmod($logDirYm, 0707);
        // }

        // // 월 디렉토리 생성
        // if (!file_exists($logDirMonth)) {
        //     mkdir($logDirMonth, 0707, true);
        //     chmod($logDirMonth, 0707);
        // }

        foreach ($dateHours as $dateHour => $types) {
            foreach ($types as $type => $entries) {
                // // 파일 경로: /log/202509/09/success_log_2025-09-09_11.txt
                // $filename = $logDirMonth . '/' . $type . '_log_' . $dateHour . '.txt';
                $content = '';

                foreach ($entries as $entry) {
                    // 기존과 동일한 가독성 있는 형식으로 저장
                    $content .= "[" . $entry['date'] . " " . $entry['time'] . "]" . " URL : " . $entry['url'] . "\n";
                    $content .= "Proxy Request:" . json_encode($entry['request_data'], JSON_UNESCAPED_UNICODE) . "\n";
                    $content .= "Proxy Response:" . json_encode($entry['response_data'], JSON_UNESCAPED_UNICODE);
                }

                syslog(LOG_INFO, $content);
                closelog();
                // file_put_contents($filename, $content, FILE_APPEND | LOCK_EX);
            }
        }

        // // 1년 이상 된 로그 정리 (배치 처리 시에만)
        // if (rand(1, 100) === 1) { // 1% 확률로 실행
        //     cleanOldLogFiles($this->logDirectory);
        // }
    }

    // private function initLogDirectory() {
    //     if (!file_exists($this->logDirectory)) {
    //         mkdir($this->logDirectory, 0707, true);
    //         chmod($this->logDirectory, 0707);
    //     }
    // }
}

/**
 * 오래된 로그 파일 정리 함수
 *
 * @param string $logDirectory 로그 디렉토리 경로
 */
// function cleanOldLogFiles($logDirectory) {
//     $yearMonthDirs = glob($logDirectory . '/*', GLOB_ONLYDIR);

//     foreach ($yearMonthDirs as $yearMonthDir) {
//         $yearMonthName = basename($yearMonthDir);

//         // 년월 형식 체크 (202509)
//         if (preg_match('/^\d{6}$/', $yearMonthName)) {
//             $folderDate = DateTime::createFromFormat('Ym', $yearMonthName);

//             if ($folderDate && $folderDate->getTimestamp() < strtotime('-180 days')) {
//                 // 월별 서브 디렉토리들 확인
//                 $monthDirs = glob($yearMonthDir . '/*', GLOB_ONLYDIR);
//                 $monthFiles = glob($yearMonthDir . '/*');
//                 $monthFiles = array_filter($monthFiles, 'is_file'); // 파일만 필터링

//                 // 월별 디렉토리 정리
//                 foreach ($monthDirs as $monthDir) {
//                     $monthName = basename($monthDir);

//                     // 월 형식 체크 (01-12)
//                     if (preg_match('/^(0[1-9]|1[0-2])$/', $monthName)) {
//                         $files = glob($monthDir . '/*');
//                         $deleteCount = 0;
//                         $totalCount = count($files);

//                         foreach ($files as $file) {
//                             if (is_file($file)) {
//                                 $fname = basename($file);
//                                 if (
//                                     preg_match('/^error_log_\d{4}-\d{2}-\d{2}_\d{2}\.txt$/', $fname) ||
//                                     preg_match('/^success_log_\d{4}-\d{2}-\d{2}_\d{2}\.txt$/', $fname)
//                                 ) {
//                                     unlink($file);
//                                     $deleteCount++;
//                                 }
//                             }
//                         }

//                         // 월 디렉토리 내 모든 파일이 삭제되면 월 디렉토리도 삭제
//                         if ($deleteCount === $totalCount && $totalCount > 0) {
//                             rmdir($monthDir);
//                         }
//                     }
//                 }

//                 // 기존 형식의 직접 파일들도 정리 (호환성)
//                 foreach ($monthFiles as $file) {
//                     $fname = basename($file);
//                     if (
//                         preg_match('/^error_log_\d{4}-\d{2}-\d{2}_\d{2}\.txt$/', $fname) ||
//                         preg_match('/^success_log_\d{4}-\d{2}-\d{2}_\d{2}\.txt$/', $fname)
//                     ) {
//                         unlink($file);
//                     }
//                 }

//                 // 년월 디렉토리가 비어있으면 삭제
//                 $remainingItems = glob($yearMonthDir . '/*');
//                 if (empty($remainingItems)) {
//                     rmdir($yearMonthDir);
//                 }
//             }
//         }
//     }
// }

/**
 * 슬로우 요청 로그 기록 함수
 *
 * @param object $requestData 요청 데이터
 * @param array $responseData 응답 데이터
 * @param string $url 요청 URL
 * @param float $executionTime 실행 시간
 */
function logSlowRequest($requestData, $responseData, $url, $executionTime) {
    try {
        openlog('myapi', LOG_PID | LOG_NDELAY, LOG_LOCAL0);

        $currentDate = date('Y-m-d');
        $currentHour = date('H');
        $currentTime = date('H:i:s');

        // $logDirectory = $_SERVER['DOCUMENT_ROOT'] . '/log/slow';

        // if (!file_exists($logDirectory)) {
        //     mkdir($logDirectory, 0707, true);
        //     chmod($logDirectory, 0707);
        // }

        // $logFile = $logDirectory . '/slow_log_' . $currentDate . '_' . $currentHour . '.txt';

        $requestJson = json_encode($requestData, JSON_UNESCAPED_UNICODE);
        $responseJson = isset($responseData['body'])
            ? json_encode(json_decode($responseData['body']), JSON_UNESCAPED_UNICODE)
            : '';

        $logContent = "===== [{$currentDate} {$currentTime}] ({$executionTime} sec) =====";
        $logContent .= "URL: {$url}\n";
        $logContent .= "Slow Request:{$requestJson}\n";
        $logContent .= "Slow Response:{$responseJson}";

        syslog(LOG_INFO, $logContent);
        closelog();

        // file_put_contents($logFile, $logContent, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        error_log("슬로우 로그 생성 실패: " . $e->getMessage());
    }
}