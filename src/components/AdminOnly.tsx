import { useAgent } from '../context/AgentContext'

interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback = null, className }) => {
  const { isAdmin } = useAgent()
  
  if (!isAdmin) {
    return <>{fallback}</>
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default AdminOnly