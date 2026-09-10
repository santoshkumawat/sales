import type { ReactNode } from 'react'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** A titled panel for tables and rankings that sit alongside charts. */
export function AnalyticsCard({
  title,
  description,
  action,
  children,
  bodyClassName,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  bodyClassName?: string
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardBody className={bodyClassName}>{children}</CardBody>
    </Card>
  )
}
