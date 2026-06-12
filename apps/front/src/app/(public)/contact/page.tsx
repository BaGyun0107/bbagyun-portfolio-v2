import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>문의하기</CardTitle>
          <CardDescription>
            프로젝트 제안이나 백엔드 엔지니어링에 대해 이야기를 나누고 싶으신가요?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">이메일로 직접 연락주세요. 보통 하루 안에 회신드립니다.</p>
            <a
              href="mailto:pus1789@gmail.com"
              className="inline-flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
            >
              <Mail className="h-5 w-5" /> pus1789@gmail.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
