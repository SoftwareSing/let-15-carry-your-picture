const IMG_15_SRC = './img/15-2000x2800.png'
const IMG_15_BACKGROUND_SRC = './img/15-2000x2800-background.png'
const IMG_DEFAULT_YOUR_SRC = './img/received_1507431059620467.jpg'

class Canvas {
  constructor (id) {
    this.canvas = document.getElementById(id)
    this.canvas.width = 2000
    this.canvas.height = 2800
    this.ctx = this.canvas.getContext('2d')
  }

  async getImg15 () {
    if (!this._img15) {
      this._img15 = await getImage(IMG_15_SRC)
    }
    return this._img15
  }

  async getImgBackground () {
    if (!this._imgBackground) {
      this._imgBackground = await getImage(IMG_15_BACKGROUND_SRC)
    }
    return this._imgBackground
  }

  async init (yourImageSrc) {
    const [imgYour, img15, imgBackground] = await Promise.all([
      getImage(yourImageSrc, { crossOrigin: 'Anonymous' }),
      this.getImg15(),
      this.getImgBackground()
    ])

    this.ctx.clearRect(0, 0, 2000, 2800)
    this.ctx.drawImage(img15, 0, 0, 2000, 2800)

    this.ctx.globalCompositeOperation = 'destination-over'
    this.ctx.drawImage(imgYour, 560, 1280, 550, 750)

    this.ctx.globalCompositeOperation = 'xor'
    this.ctx.drawImage(imgBackground, 0, 0, 2000, 2800)

    this.ctx.globalCompositeOperation = 'source-over'
  }

  toDataURL () {
    return this.canvas.toDataURL()
  }
}

async function main () {
  await changePicture(IMG_DEFAULT_YOUR_SRC)
}

function getImage (src, { crossOrigin } = {}) {
  const img = new Image()
  if (crossOrigin) img.setAttribute('crossOrigin', crossOrigin)
  img.src = src
  return new Promise((resolve, reject) => {
    img.onload = resolve.bind(this, img)
    img.onerror = reject.bind(this)
  })
}

async function changePicture (imgSrc) {
  await canvas.init(imgSrc)
}

window.clickChangeButton = function () {
  const input = document.getElementById('input-img-src')
  const imgSrc = input.value
  changePicture(imgSrc)
}

window.clickDownloadButton = function () {
  const downloadElementA = document.createElement('a')
  downloadElementA.download = `15-with-you-${Date.now()}.png`
  downloadElementA.href = canvas.toDataURL()
  downloadElementA.click()
}

const canvas = new Canvas('canvas')
main()
