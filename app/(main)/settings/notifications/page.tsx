import { MobileLayout } from '@/components/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NotificationsPage() {
  return (
    <MobileLayout title="Notifications" showBackButton={true} backHref="/settings">
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              This feature is coming soon. Check back later!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </MobileLayout>
  )
}
