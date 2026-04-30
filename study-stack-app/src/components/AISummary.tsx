import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AIService } from "@/lib/AIService";
import { FileText, Loader2, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AISummaryProps {
  noteTitle: string;
  noteDescription: string;
}

export default function AISummary({ noteTitle, noteDescription }: AISummaryProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    setLoading(true);
    try {
      const generated = await AIService.generateSummary(noteTitle, noteDescription);
      setSummary(generated);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
      <div className="bg-primary/5 p-4 flex items-center justify-between border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-black text-sm uppercase tracking-widest">AI Master Summary</h3>
        </div>
        {summary && (
          <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 rounded-full">
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      <CardContent className="p-6">
        {!summary ? (
          <div className="text-center space-y-4 py-8">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">Need a quick refresher?</h4>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                Our AI can boil down this material into the most critical points for your exams.
              </p>
            </div>
            <Button 
              onClick={generateSummary} 
              disabled={loading}
              className="rounded-full font-bold px-6 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                "Generate AI Summary"
              )}
            </Button>
          </div>
        ) : (
          <div className="prose prose-sm prose-primary max-w-none animate-fade-in">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {summary}
            </div>
            <div className="mt-8 pt-4 border-t border-dashed border-border flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSummary(null)}
                className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary"
              >
                Regenerate Summary
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
