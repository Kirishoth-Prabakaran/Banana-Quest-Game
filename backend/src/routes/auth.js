const express = require('express')
const supabase = require('../config/supabase')

const router = express.Router()

router.post('/register', async (request, response) => {
  const { nickname, email, password } = request.body || {}

  if (
    typeof nickname !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return response.status(400).json({
      message: 'Please enter a nickname, email address, and password.',
    })
  }

  const cleanNickname = nickname.trim()
  const cleanEmail = email.trim().toLowerCase()

  if (
    cleanNickname.length < 2 ||
    cleanNickname.length > 20 ||
    !/^[\p{L}\p{N} _-]+$/u.test(cleanNickname)
  ) {
    return response.status(400).json({
      message: 'Your nickname must be 2–20 letters, numbers, spaces, or hyphens.',
    })
  }

  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    return response.status(400).json({
      message: 'Please enter a valid email address.',
    })
  }

  if (password.length < 8 || password.length > 72) {
    return response.status(400).json({
      message: 'Your password must be between 8 and 72 characters.',
    })
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { nickname: cleanNickname },
    },
  })

  if (error) {
    console.error('Account registration failed:', error.message)
    return response.status(400).json({
      message:
        'We could not create that account. Check your details or try another email address.',
    })
  }

  if (!data.user) {
    throw new Error('Supabase did not return a user after successful registration.')
  }

  return response.status(201).json({
    message: data.session
      ? 'Your explorer account is ready. Let the adventure begin!'
      : 'Your explorer account is almost ready! Check your email for a verification link.',
    emailVerificationRequired: !data.session,
  })
})

router.post('/login', async (request, response) => {
  const { email, password } = request.body || {}

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim().length === 0 ||
    email.trim().length > 254 ||
    password.length < 8 ||
    password.length > 72
  ) {
    return response.status(400).json({
      message: 'Please enter a valid email address and password.',
    })
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (error.code === 'email_not_confirmed') {
      return response.status(401).json({
        message: 'Please verify your email address before logging in.',
      })
    }

    console.error('Account login failed:', error.message)
    return response.status(401).json({
      message: 'That email and password do not match. Please try again.',
    })
  }

  if (!data.session || !data.user) {
    throw new Error('Supabase did not return a session after successful login.')
  }

  return response.status(200).json({
    message: `Welcome back, ${data.user.user_metadata?.nickname || 'explorer'}!`,
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      expiresIn: data.session.expires_in,
      tokenType: data.session.token_type,
      user: {
        id: data.user.id,
        email: data.user.email,
        nickname: data.user.user_metadata?.nickname || 'Banana Explorer',
      },
    },
  })
})

module.exports = router
