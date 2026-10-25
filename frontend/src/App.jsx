import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const EMPTY_FORM = {
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function App() {
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState(EMPTY_FORM)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loggedInEmail, setLoggedInEmail] = useState(
    () => sessionStorage.getItem('bananaQuestEmail') || '',
  )

  function updateForm(event) {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
    setMessage('')
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setMessageType('error')
      setMessage('Those passwords do not match. Try again!')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'register'
            ? {
                nickname: form.nickname,
                email: form.email,
                password: form.password,
              }
            : { email: form.email, password: form.password },
        ),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'We could not complete your request.')
      }

      if (mode === 'login') {
        if (!result.session?.accessToken || !result.session?.refreshToken) {
          throw new Error('The login response did not include a valid session.')
        }
        sessionStorage.setItem('bananaQuestSession', JSON.stringify(result.session))
        sessionStorage.setItem('bananaQuestEmail', result.session.user.email)
        setLoggedInEmail(result.session.user.email)
      }

      setMessageType('success')
      setMessage(result.message)
      setForm(EMPTY_FORM)
    } catch (error) {
      setMessageType('error')
      setMessage(
        error instanceof TypeError
          ? 'We could not reach the game server. Please try again in a moment.'
          : error.message,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('bananaQuestSession')
    sessionStorage.removeItem('bananaQuestEmail')
    setLoggedInEmail('')
    setMessageType('success')
    setMessage('You have logged out. Come back soon, explorer!')
  }

  const isRegistering = mode === 'register'

  return (
    <main className="register-page">
      <div className="sunburst" aria-hidden="true" />
      <div className="floating-fruit fruit-one" aria-hidden="true">🍌</div>
      <div className="floating-fruit fruit-two" aria-hidden="true">⭐</div>
      <div className="floating-fruit fruit-three" aria-hidden="true">🍊</div>

      <section className="register-layout" aria-labelledby="welcome-heading">
        <div className="welcome-panel">
          <a className="brand" href="/" aria-label="Banana Quest home">
            <span className="brand-icon" aria-hidden="true">🍌</span>
            <span>banana quest</span>
          </a>

          <div className="welcome-copy">
            <p className="eyebrow">READY, SMART EXPLORER?</p>
            <h1 id="welcome-heading">
              Big brains.
              <br />
              <span>Banana</span> fun!
            </h1>
            <p className="welcome-description">
              Make your explorer profile and jump into quizzes, curious
              challenges, and a whole bunch of banana-powered fun.
            </p>
          </div>

          <div className="mascot" role="img" aria-label="A cheerful panda mascot">
            <span className="mascot-sparkle sparkle-left" aria-hidden="true">✦</span>
            <span className="mascot-panda" aria-hidden="true">🐼</span>
            <span className="mascot-sparkle sparkle-right" aria-hidden="true">✦</span>
            <span className="mascot-caption">Your next adventure awaits!</span>
          </div>
        </div>

        <div className="form-card">
          {loggedInEmail ? (
            <div className="signed-in-panel">
              <span className="step-badge">🎉 ADVENTURE UNLOCKED</span>
              <h2>Welcome back!</h2>
              <p className="signed-in-email">{loggedInEmail}</p>
              <p className="signed-in-copy">
                Your explorer is ready. Let&apos;s make today a smart one!
              </p>
              <button className="submit-button" onClick={handleLogout} type="button">
                Log out
              </button>
            </div>
          ) : (
            <>
              <div className="auth-tabs" aria-label="Account options">
                <button
                  aria-pressed={isRegistering}
                  className={`auth-tab${isRegistering ? ' active' : ''}`}
                  onClick={() => changeMode('register')}
                  type="button"
                >
                  Create account
                </button>
                <button
                  aria-pressed={!isRegistering}
                  className={`auth-tab${!isRegistering ? ' active' : ''}`}
                  onClick={() => changeMode('login')}
                  type="button"
                >
                  Log in
                </button>
              </div>

              <div className="card-heading">
                <span className="step-badge">
                  {isRegistering ? '🌟 YOUR ADVENTURE STARTS HERE' : '🐼 YOUR ADVENTURE CONTINUES'}
                </span>
                <h2>{isRegistering ? 'Create your explorer' : 'Welcome back, explorer!'}</h2>
                <p>
                  {isRegistering
                    ? 'Pick a nickname, then you’re ready to go!'
                    : 'Log in and hop back into the fun.'}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {isRegistering && (
                  <>
                    <label htmlFor="nickname">Explorer nickname</label>
                    <input
                      autoComplete="nickname"
                      id="nickname"
                      maxLength={20}
                      minLength={2}
                      name="nickname"
                      onChange={updateForm}
                      placeholder="e.g. BananaBuddy"
                      required
                      value={form.nickname}
                    />
                  </>
                )}

                <label htmlFor="email">Email address</label>
                <input
                  autoComplete="email"
                  id="email"
                  name="email"
                  onChange={updateForm}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={form.email}
                />

                <label htmlFor="password">{isRegistering ? 'Make a password' : 'Password'}</label>
                <input
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  id="password"
                  maxLength={72}
                  minLength={8}
                  name="password"
                  onChange={updateForm}
                  placeholder={isRegistering ? 'At least 8 characters' : 'Your password'}
                  required
                  type="password"
                  value={form.password}
                />

                {isRegistering && (
                  <>
                    <label htmlFor="confirmPassword">Type it one more time</label>
                    <input
                      autoComplete="new-password"
                      id="confirmPassword"
                      maxLength={72}
                      minLength={8}
                      name="confirmPassword"
                      onChange={updateForm}
                      placeholder="Your password again"
                      required
                      type="password"
                      value={form.confirmPassword}
                    />
                    <p className="privacy-note">
                      Please ask a grown-up before sharing personal information online.
                    </p>
                  </>
                )}

                <button className="submit-button" disabled={isSubmitting} type="submit">
                  {isSubmitting
                    ? isRegistering
                      ? 'Making your explorer...'
                      : 'Finding your explorer...'
                    : isRegistering
                      ? 'Let’s play!'
                      : 'Log in and play!'}
                  <span aria-hidden="true"> →</span>
                </button>

                <p
                  aria-live="polite"
                  className={`form-message ${messageType}`}
                  role={messageType === 'error' ? 'alert' : 'status'}
                >
                  {message}
                </p>
              </form>

              <div className="card-footer">
                <span aria-hidden="true">🍌</span>
                One small signup. One giant adventure.
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="page-footer">
        Made for curious minds <span aria-hidden="true">♥</span>
      </footer>
    </main>
  )
}

export default App
