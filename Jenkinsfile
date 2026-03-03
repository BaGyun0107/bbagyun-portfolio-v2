pipeline {
    agent any

    tools {
        nodejs 'NodeJS 24.13.1'
    }

    environment {
        SLACK_CHANNEL = '#dev_jenkins_log'
        REMOTE_DIR = '/home/rocky'
        GITHUB_URL = 'https://github.com/CODIWORKS-Engineer/codi-gtn-next.git'
        // DEV
        DEV_REMOTE_SERVER = 'rocky@10.0.10.22'
        DEV_ENV_ID = 'codi_gtn_front_env.development'
        DEV_ENV_NAME = '.env.production'
        DEV_BUILD_FILE_NAME = 'codi_gtn_front_dev.tar.gz'
        DEV_SHELL_FILE = 'deploy_gtn_front_dev.sh'
        // PRD
        PRD_REMOTE_SERVER = ''
        PRD_ENV_ID = ''
        PRD_ENV_NAME = ''
        PRD_BUILD_FILE_NAME = ''
        PRD_SHELL_FILE = ''
    }

    stages {
        stage('Github Clone') {
            steps {
                slackSend (channel: SLACK_CHANNEL, color: '#FFFF00', message: "STARTING: Job ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${env.BUILD_URL})")
                script {
                    if (env.BRANCH_NAME == 'dev') {
                        env.ENV_ID = env.DEV_ENV_ID
                        env.BUILD_FILE_NAME = env.DEV_BUILD_FILE_NAME
                        env.SHELL_FILE = env.DEV_SHELL_FILE
                        env.REMOTE_SERVER = env.DEV_REMOTE_SERVER
                        env.ENV_NAME = env.DEV_ENV_NAME
                    } else if (env.BRANCH_NAME == 'prd') {
                        env.ENV_ID = env.PRD_ENV_ID
                        env.BUILD_FILE_NAME = env.PRD_BUILD_FILE_NAME
                        env.SHELL_FILE = env.PRD_SHELL_FILE
                        env.REMOTE_SERVER = env.PRD_REMOTE_SERVER
                        env.ENV_NAME = env.PRD_ENV_NAME
                    } else {
                      error 'Invalid branch: ${env.BRANCH_NAME}'
                    }

                    git branch: "${env.BRANCH_NAME}",
                    credentialsId: 'github-access-token',
                    url: "${GITHUB_URL}"
                }
            }
        }
        stage('Building Project') {
            steps {
                // github clone된 directory로 이동
                script {
                    withCredentials([file(credentialsId: "${ENV_ID}", variable: 'ENV_FILE')]) {
                        sh 'cp $ENV_FILE ${ENV_NAME}'
                    }
                }
                sh 'corepack enable pnpm'
                sh 'pnpm install --frozen-lockfile'
                sh 'pnpm prisma generate'
                sh 'pnpm build'
            }
        }
        stage('Compression') {
            steps {
                script {
                    sh '''
                        # 필요한 파일만 압축
                        tar -czvf deploy.tar.gz \
                            package.json \
                            pnpm-lock.yaml \
                            next.config.ts \
                            tsconfig.json \
                            prisma \
                            public \
                            src \
                            ecosystem.config.js \
                            .env
                    '''
                }
            }
        }
        stage('Deploy to Server') {
            steps {
                script {
                    sshagent(credentials: ['codiworks-nhn']) {
                        sh '''
                            scp -o StrictHostKeyChecking=no ${BUILD_FILE_NAME} ${REMOTE_SERVER}:${REMOTE_DIR}
                            ssh -o StrictHostKeyChecking=no ${REMOTE_SERVER} "cd ${REMOTE_DIR} && sh ${SHELL_FILE}"
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            slackSend (channel: SLACK_CHANNEL, color: '#00FF00', message: "SUCCESSFUL: Job ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${env.BUILD_URL})")
        }
        failure {
            slackSend (channel: SLACK_CHANNEL, color: '#FF0000', message: "FAILED: Job ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${env.BUILD_URL})")
        }
        always {
            cleanWs()
        }
    }
}
