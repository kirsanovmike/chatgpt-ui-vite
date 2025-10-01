import { useRoute as vrUseRoute, useRouter as vrUseRouter } from 'vue-router'

export const useRoute = () => vrUseRoute()
export const useRouter = () => vrUseRouter()

export const navigateTo = (to: string) => {
  const router = vrUseRouter()
  return router.push(to)
}
