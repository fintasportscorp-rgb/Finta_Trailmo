"use client"

import { useTemplate } from "@/lib/template-store"
import { useAnalysis } from "@/lib/analysis-store"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Trash2, Play } from "lucide-react"

export function ActionBar() {
  const { enabledCount, dispatch } = useTemplate()
  const { dispatch: analysisDispatch } = useAnalysis()
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-4 py-3 md:px-6">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={enabledCount === 0}
            className="text-destructive-foreground hover:text-destructive-foreground hover:bg-destructive/10"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {t("action.clearAll")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("action.clearTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("action.clearDesc", {
                count: String(enabledCount),
                s: enabledCount !== 1 ? "s" : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dispatch({ type: "CLEAR_ALL" })
                toast.success(t("action.cleared"))
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("action.clearAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        size="sm"
        disabled={enabledCount === 0}
        onClick={() => {
          analysisDispatch({ type: "SET_VIEW", view: "analysis" })
        }}
      >
        <Play className="mr-1.5 h-3.5 w-3.5" />
        {t("action.launchAnalysis")}
      </Button>
    </div>
  )
}
