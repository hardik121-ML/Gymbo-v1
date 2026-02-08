import { AppShell } from '@/components/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProfilePage() {
  return (
    <AppShell title="profile" showBackButton={true} backHref="/settings">
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              This feature is coming soon. Check back later!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </AppShell>
  )
}
