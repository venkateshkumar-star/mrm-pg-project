import AppRoutes from "./routes/AppRoutes"
import "./assets/styles/global.scss"
import { BrowserRouter as Router } from "react-router-dom"
import { NotificationProvider } from "@/components/ui/Notification/NotificationContext"

function App() {

  return (
    <>
      <Router>
        <NotificationProvider maxNotifications={5} defaultDuration={5000}>
          <AppRoutes />
        </NotificationProvider>
      </Router>
    </>
  )
}

export default App
