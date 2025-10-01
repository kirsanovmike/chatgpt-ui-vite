import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const SignIn      = () => import('@/pages/account/Signin.vue')
const SignUp      = () => import('@/pages/account/Signup.vue')
const Onboarding  = () => import('@/pages/account/Onboarding.vue')
const VerifyEmail = () => import('@/pages/account/VerifyEmail.vue')
const Chat        = () => import('@/pages/index.vue')
// если нужна страница смены пароля — добавь:
// const ResetPassword = () => import('@/pages/account/ResetPassword.vue')

const routes: RouteRecordRaw[] = [
  { path: '/account/signin', name: 'signin', component: SignIn, meta: { title: 'Sign in', requiresAuth: false } },
  { path: '/account/signup', name: 'signup', component: SignUp, meta: { title: 'Sign up', requiresAuth: false } },
  { path: '/account/onboarding', name: 'onboarding', component: Onboarding, meta: { title: 'Onboarding', requiresAuth: true } },
  { path: '/account/verify-email/:token', name: 'verify', component: VerifyEmail, meta: { title: 'Verify Email', requiresAuth: false } },
  { path: '/:id?', name: 'chat', component: Chat, meta: { title: 'Chat', requiresAuth: true, keepAlive: true } },
  // { path: '/account/reset-password', name: 'reset', component: ResetPassword, meta: { title: 'Reset Password', requiresAuth: true } }
]

export default createRouter({ history: createWebHistory(), routes })
