import React, { useEffect, useState } from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Transactions from 'scenes/Transactions'
import Auth from 'scenes/Auth'
import Budgets from 'scenes/Budgets'
import Results2020 from 'scenes/Results2020'
import { getLoginState } from 'store/token'
import RegularSyncHandler from 'components/RegularSyncHandler'
import CssBaseline from '@material-ui/core/CssBaseline'
import Nav from 'components/Navigation'
import MobileNav from 'components/MobileNav'
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
} from '@material-ui/core'
import { ThemeProvider } from '@material-ui/styles'
import { createTheme } from 'helpers/createTheme'
import { getTheme } from 'store/theme'
import { Helmet } from 'react-helmet'
import { createBrowserHistory } from 'history'
import ErrorBoundary from 'components/ErrorBoundary'
import { getLastSyncTime, getRootUserId } from 'store/serverData'
import Accounts from 'scenes/Accounts'
import Stats from 'scenes/Stats'
import About from 'scenes/About'
import Token from 'scenes/Token'
import Donation from 'scenes/Donation'
import { initTracking, setUserId } from 'helpers/tracking'

const history = createBrowserHistory()
initTracking(history)

export default function App() {
  const isLoggedIn = useSelector(getLoginState)
  const themeType = useSelector(getTheme)
  const theme = createTheme(themeType)
  const userId = useSelector(getRootUserId)
  useEffect(() => {
    setUserId(userId)
  }, [userId])

  return (
    <ThemeProvider theme={theme}>
      <>
        <CssBaseline />
        <ErrorBoundary>
          <Helmet>
            <meta name="theme-color" content={theme.palette.background.paper} />
          </Helmet>
          <Router history={history}>
            <Switch>
              <Route path="/about" component={About} />
              <Route path="/about/*" component={About} />
              <Route path="/*" component={isLoggedIn ? PrivateApp : Auth} />
            </Switch>
          </Router>
        </ErrorBoundary>
      </>
    </ThemeProvider>
  )
}

const PrivateApp = () => {
  const hasData = useSelector(state => !!getLastSyncTime(state))
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  return (
    <Box display="flex">
      {isMobile ? <MobileNav /> : <Nav />}
      <RegularSyncHandler />
      <Box minHeight="100vh" flexGrow={1}>
        <ErrorBoundary>
          {hasData ? (
            <Switch>
              <Route path="/transactions" component={Transactions} />
              <Route path="/2020" component={Results2020} />
              <Route path="/accounts" component={Accounts} />
              <Route path="/budget/:month" component={Budgets} />
              <Route path="/budget" component={Budgets} />
              <Route path="/stats" component={Stats} />
              <Route path="/token" component={Token} />
              <Route path="/donation" component={Donation} />
              <Redirect to="/budget" />
            </Switch>
          ) : (
            <MainLoader />
          )}
        </ErrorBoundary>
      </Box>
    </Box>
  )
}

const hints = [
  { hint: 'Первая загрузка самая долгая 😅', delay: 5000 },
  { hint: 'Всё зависит от интернета и количества операций 🤞', delay: 10000 },
  { hint: 'Может всё-таки загрузится? 🤔', delay: 30000 },
  { hint: 'Что-то долго, попробуйте перезагрузить страницу 🤪', delay: 45000 },
]

function MainLoader() {
  const [hint, setHint] = useState('Загружаемся... 🖤')

  useEffect(() => {
    const timers = hints.map(({ hint, delay }) =>
      setTimeout(() => setHint(hint), delay)
    )
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [])
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
    >
      <CircularProgress />
      <Box mt={4} width="200">
        <Typography align="center">{hint}</Typography>
      </Box>
    </Box>
  )
}
