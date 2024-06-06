import  { ActionMessage } from './action'
import { takeWhileMap, dropWhile } from "./lib"

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const defaultAddress = `${protocol}//${window.location.host}${window.location.pathname}`

export class SocketConnection {


  socket:WebSocket

  hasEverConnected:Boolean
  isConnected:Boolean
  reconnectDelay:number = 0

  constructor() {}

  // we need to faithfully transmit the
  connect(addr = defaultAddress) {
    const sock = new WebSocket(addr)
    this.socket = sock

    function onConnectError(ev:Event) {
      console.log("Connection Error", ev)
    }

    sock.addEventListener('error', onConnectError)

    sock.addEventListener('open', (event) => {
      console.log("Opened", event)
      this.isConnected = true
      this.hasEverConnected = true
      this.reconnectDelay = 0
      this.socket.removeEventListener('error', onConnectError)
    })

    // TODO: Don't reconnet if the socket server is OFF, only if we've successfully connected once
    sock.addEventListener('close', _ => {
      this.isConnected = false
      console.log("Closed")

      // attempt to reconnect in 1s
      if (this.hasEverConnected) {
        this.reconnectDelay += 1000
        console.log("Reconnecting in " + (this.reconnectDelay/1000) + "s")
        setTimeout(() => this.connect(addr), this.reconnectDelay)
      }
    })
  }

  async sendAction(action:ActionMessage):Promise<string> {
    // console.log("SOCKET sendAction", action)
    let msg = [ action.url.pathname + action.url.search
              , "Host: " + window.location.host
              , "Cookie: " + document.cookie
              , "Correlation: " + action.correlation
              , action.form
              ].join("\n")
    let {metadata, rest} = await this.fetch(msg, parseMetadataResponse, action.correlation)

    if (metadata.error) {
      throw socketError(metadata.error)
    }

    if (metadata.session) {
      // console.log("setting cookie", metadata.session)
      document.cookie = metadata.session
    }

    if (metadata.redirect) {
      window.location.href = metadata.redirect
    }

    return rest
  }

  async fetch(msg:string, parse:((data:string) => SocketResponse | null), correlation:number):Promise<SocketResponse> {
    this.sendMessage(msg)
    let res = await this.waitMessage(parse, correlation)
    return res
  }

  private sendMessage(msg:string) {
    this.socket.send(msg)
  }

  private async waitMessage(parse:((data:string) => SocketResponse | null), correlation:number):Promise<SocketResponse> {
    return new Promise((resolve, reject) => {
      const onMessage = (event:MessageEvent) => {
        const data = event.data
        const parsed = parse(data);
        if(parsed && parsed.metadata.correlation == correlation) {
          resolve(parsed);
          this.socket.removeEventListener('message', onMessage);
        }
      }

      this.socket.addEventListener('message', onMessage)
      this.socket.addEventListener('error', reject)
    })
  }

  disconnect() {
    this.socket.close()
  }
}

function socketError(inp:string):Error {
    let error = new Error()
    error.name = inp.substring(0, inp.indexOf(' '));
    error.message = inp.substring(inp.indexOf(' ') + 1);
    return error
}


console.log("CONNECTING", window.location)

type SocketResponse = {
  metadata: Metadata,
  rest: string
}

type Metadata = {
  session?: string
  target?: string
  correlation?: number
  redirect?: string
  error?: string
}

type Meta = {key: string, value: string}


function parseMetadataResponse(ret:string):SocketResponse {
  let lines = ret.split("\n")
  let metas:Metadata = parseMetas(takeWhileMap(parseMeta, lines))
  let rest = dropWhile(parseMeta, lines).join("\n")

  return {
    metadata: metas,
    rest: rest
  }

  function parseMeta(line:string):Meta | undefined {
    let match = line.match(/^\|(\w+)\|(.*)$/)
    if (match) {
      return {
        key: match[1],
        value: match[2]
      }
    }
  }
}

function parseMetas(meta:Meta[]):Metadata {
  return {
    session: meta.find(m => m.key == "SESSION")?.value,
    target: meta.find(m => m.key == "TARGET")?.value,
    correlation: + meta.find(m => m.key == "CORRELATION")?.value,
    redirect: meta.find(m => m.key == "REDIRECT")?.value,
    error: meta.find(m => m.key == "ERROR")?.value
  }
}
