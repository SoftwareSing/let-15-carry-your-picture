const IMG_PHOTO_FRAME_BG_SRC = './img/2/photo-frame-bg-green.png'
const IMG_15_OUT_PHOTO_FRAME_SRC = './img/2/15-out-photo-frame.png'
const IMG_15_IN_PHOTO_FRAME_SRC = './img/2/15-in-photo-frame.png'

const IMG_DEFAULT_YOUR_SRC = './img/2/default-859x2000.png'
const IMG_FISH_SRC = './img/fish-1100x1500.png'

const CANVAS_WIDTH = 3840
const CANVAS_HEIGHT = 2160
const PHOTO_WIDTH = 859
const PHOTO_HEIGHT = 2000
const PHOTO_X = 2364
const PHOTO_Y = 91

class Canvas {
  constructor (id) {
    this.canvas = document.getElementById(id)
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT
    this.ctx = this.canvas.getContext('2d')
    this.yourImageSrc = IMG_DEFAULT_YOUR_SRC
    this.config = {
      inPhotoFrameBackground: 'color', // '15', 'transparent', 'color'
      inPhotoFrameBackgroundColor: '#FFFFFF'
    }
  }

  async init (yourImageSrc = this.yourImageSrc) {
    this.yourImageSrc = yourImageSrc
    const [imgYour, imgInFrameBackground, img15OutFrame] = await Promise.all([
      ImageLoader.getImage(yourImageSrc, { crossOrigin: 'Anonymous' }),
      this.getImgInPhotoFrameBackground(),
      ImageLoader.getKeepImage(IMG_15_OUT_PHOTO_FRAME_SRC)
    ])
    const imgYourCut = await this.cutOutImageInPhotoFrame(imgYour)

    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    this.ctx.globalCompositeOperation = 'source-out'
    this.ctx.drawImage(imgYourCut, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 在 imgYour 的後方貼上相框後的圖片
    if (imgInFrameBackground) {
      this.ctx.globalCompositeOperation = 'destination-over'
      this.ctx.drawImage(imgInFrameBackground, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // 在最前方貼上剩餘部分
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.drawImage(img15OutFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    this.ctx.globalCompositeOperation = 'source-over'
  }

  async getImgInPhotoFrameBackground () {
    const { inPhotoFrameBackground, inPhotoFrameBackgroundColor } = this.config
    switch (inPhotoFrameBackground) {
      case '15': {
        return await ImageLoader.getKeepImage(IMG_15_IN_PHOTO_FRAME_SRC)
      }
      case 'transparent': {
        return undefined
      }
      case 'color': {
        const canvas = document.createElement('canvas')
        canvas.width = PHOTO_WIDTH
        canvas.height = PHOTO_HEIGHT
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = inPhotoFrameBackgroundColor
        ctx.fillRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT)
        return await this.cutOutImageInPhotoFrame(canvas)
      }
    }
  }

  async cutOutImageInPhotoFrame (img) {
    const imgPhotoFrame = await ImageLoader.getKeepImage(IMG_PHOTO_FRAME_BG_SRC)
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')

    // 將不應顯示的空間填滿 (僅相框內保留透明)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(imgPhotoFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 在透明區域貼上 img , 並把前一張圖清空
    ctx.globalCompositeOperation = 'source-out'
    ctx.drawImage(img, PHOTO_X, PHOTO_Y, PHOTO_WIDTH, PHOTO_HEIGHT)

    return canvas
  }

  toDataURL () {
    return this.canvas.toDataURL()
  }
}

class ImageLoader {
  static getImage (src, { crossOrigin = '' } = {}) {
    const img = new Image()
    if (crossOrigin) img.setAttribute('crossOrigin', crossOrigin)
    img.src = src

    return new Promise((resolve, reject) => {
      img.onload = resolve.bind(this, img)
      img.onerror = reject.bind(this)
    })
  }

  static getKeepImage (src, { crossOrigin = '' } = {}) {
    const keepKey = `keep:${src}:${crossOrigin}`
    const keepImage = this[keepKey]
    if (keepImage) return keepImage

    const image = this.getImage(src, { crossOrigin })
    this[keepKey] = image
    image.catch(() => {
      delete this[keepKey]
    })
    return image
  }
}

async function main () {
  await changePicture(IMG_DEFAULT_YOUR_SRC)
}

function getImageFileSrc (file) {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  return new Promise((resolve, reject) => {
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject.bind(this)
  })
}

async function getClipboardImageItemSrc (item, type) {
  const blob = await item.getType(type)
  return URL.createObjectURL(blob)
}

async function changePicture (imgSrc) {
  await canvas.init(imgSrc)
}

window.useFishPicture = async function () {
  await changePicture(IMG_FISH_SRC)
}

window.clickChangeButton = async function () {
  const input = document.getElementById('input-img-src')
  const imgSrc = input.value
  await changePicture(imgSrc)
}

window.changeInputFile = async function (files) {
  const file = files[0]
  if (!file || !(/^image/.test(file.type))) return
  const src = await getImageFileSrc(file)
  await changePicture(src)
}

document.addEventListener('paste', getFromClipboard)

async function getFromClipboard () {
  const items = await navigator.clipboard.read()
  const fileItem = getImageItem(items)
  if (!fileItem) return

  const src = await getClipboardImageItemSrc(fileItem.item, fileItem.type)
  await changePicture(src)
}

function getImageItem (items) {
  for (const item of items) {
    for (const type of item.types) {
      if (/^image/.test(type)) return { item, type }
    }
  }
}

window.changeInPhotoFrameBackground = async function (value) {
  canvas.config.inPhotoFrameBackground = value
  await canvas.init()
}

window.changeInPhotoFrameBackgroundColor = async function (value) {
  canvas.config.inPhotoFrameBackgroundColor = value
  await canvas.init()
}

window.clickDownloadButton = function () {
  const downloadElementA = document.createElement('a')
  downloadElementA.download = `15-with-you-${Date.now()}.png`
  downloadElementA.href = canvas.toDataURL()
  downloadElementA.click()
}

const canvas = new Canvas('canvas')
main()
