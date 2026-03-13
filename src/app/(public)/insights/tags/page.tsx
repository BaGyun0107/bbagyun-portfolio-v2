import Link from "next/link";
import { Calendar, Clock, Tag as TagIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineMarkdown } from "@/components/ui/InlineMarkdown";
import { InsightService } from "@/lib/api/services/insight.service";

export const dynamic = 'force-dynamic';

function getInitialChar(str: string) {
  const code = str.charCodeAt(0);
  if (code >= 44032 && code <= 55203) {
    const cho = Math.floor((code - 44032) / 588);
    const choList = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    return choList[cho];
  }
  return str.charAt(0).toUpperCase();
}

export default async function InsightsTagsPage(props: { searchParams: Promise<{ tag?: string }> }) {
  const searchParams = await props.searchParams;
  const currentTag = searchParams?.tag;
  const tags = await InsightService.getInsightTags();
  const insights = currentTag ? await InsightService.getInsightsByTag(currentTag) : [];

  const groupedTags: Record<string, typeof tags> = {};
  tags.forEach(tagData => {
    const initial = getInitialChar(tagData.tag);
    if (!groupedTags[initial]) groupedTags[initial] = [];
    groupedTags[initial].push(tagData);
  });

  // Sort groups alphabetically (English first, Korean later depending on localeCompare behavior, actually let's sort logically)
  const sortedKeys = Object.keys(groupedTags).sort((a, b) => {
    return a.localeCompare(b, 'ko');
  });

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">태그</h1>
        <p className="text-xl font-medium text-zinc-600 dark:text-zinc-400">
          관심 있는 주제의 태그를 선택해보세요.
        </p>
      </div>

      {!currentTag ? (
        <div className="space-y-12">
          {sortedKeys.map(key => (
            <div key={key} className="space-y-6">
              <h2 className="text-2xl font-bold border-b pb-2">{key}</h2>
              <div className="flex flex-wrap gap-3">
                {groupedTags[key].map(tagData => (
                  <Link 
                    key={tagData.tag} 
                    href={`/insights/tags?tag=${encodeURIComponent(tagData.tag)}`}
                    className="group"
                  >
                    <Badge 
                      variant="outline" 
                      className="text-base md:text-lg py-1.5 md:py-2 px-4 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 rounded-full text-zinc-600 dark:text-zinc-400"
                    >
                      <TagIcon className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors" />
                      <span className="group-hover:text-primary transition-colors">{tagData.tag}</span>
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full px-2 py-0.5 text-xs ml-1 font-mono">
                        {tagData.count}
                      </span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-lg">등록된 태그가 없습니다.</p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b pb-6">
            <Link href="/insights/tags" className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shrink-0">
              &larr; 모든 태그 보기
            </Link>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-primary italic">#{currentTag}</span>
              <span className="text-lg text-muted-foreground font-normal mt-1">({insights.length}개의 게시물)</span>
            </h2>
          </div>

          <div className="space-y-6">
            {insights.length > 0 ? insights.map((insight) => (
              <Link key={insight.id} href={`/insights/${insight.slug}`} className="block group">
                <Card className="border-transparent bg-transparent shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <CardContent className="p-6 md:p-8 border-b group-hover:border-transparent">
                    <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(insight.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {insight.readTime}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                          {insight.title}
                        </h3>
                        <InlineMarkdown content={insight.excerpt} className="text-muted-foreground leading-relaxed max-w-2xl" />
                        <div className="flex gap-2 pt-2 flex-wrap">
                          {insight.tags.map(tag => (
                            <Badge key={tag} variant={tag === currentTag ? "default" : "secondary"} className="font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <p className="text-muted-foreground py-16 text-center text-lg">해당 태그의 게시물이 존재하지 않습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
