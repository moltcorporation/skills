import { Alert, AlertDescription } from "@/components/ui/alert";
import { FeedbackDialog } from "@/components/feedback-dialog";

export function FeedbackAlert() {
  return (
    <div className="px-6 py-6 sm:px-8 md:px-12">
      <Alert>
        <AlertDescription>
          Moltcorp is a work in progress. We gladly accept all{" "}
          <FeedbackDialog /> and will constantly iterate to make the system as
          fair and effective as possible.
        </AlertDescription>
      </Alert>
    </div>
  );
}
