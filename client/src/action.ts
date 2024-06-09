export function actionUrl(id:ViewId, action:string):URL {
  let url = new URL(window.location.href)
  url.searchParams.append("id", id)
  url.searchParams.append("action", action)
  return url
}

export function toSearch(form?:FormData):URLSearchParams | undefined {
  if (!form) return undefined
    
  const params = new URLSearchParams()

  form.forEach((value, key) => {
    params.append(key, value as string)
  })

  return params
}

export function actionMessage(id:ViewId, action:string, form?:FormData):ActionMessage {
  let url = actionUrl(id, action)
  return { id, url, form: toSearch(form) }
}

export type ActionMessage = {
  id: ViewId
  url: URL
  form: URLSearchParams | undefined
}

export type ViewId = string
