const IMG_PHOTO_FRAME_BG_SRC = './img/photo-frame-bg-green.png'
const IMG_15_OUT_PHOTO_FRAME_SRC = './img/15-out-photo-frame.png'
const IMG_15_IN_PHOTO_FRAME_SRC = './img/15-in-photo-frame.png'

const IMG_DEFAULT_YOUR_SRC = './img/transparent-550x750.png'

class Canvas {
  constructor (id) {
    this.canvas = document.getElementById(id)
    this.canvas.width = 2000
    this.canvas.height = 2800
    this.ctx = this.canvas.getContext('2d')
  }

  async init (yourImageSrc) {
    const [imgYour, imgPhotoFrame, img15InFrame, img15OutFrame] = await Promise.all([
      ImageLoader.getImage(yourImageSrc, { crossOrigin: 'Anonymous' }),
      ImageLoader.getKeepImage(IMG_PHOTO_FRAME_BG_SRC),
      ImageLoader.getKeepImage(IMG_15_IN_PHOTO_FRAME_SRC),
      ImageLoader.getKeepImage(IMG_15_OUT_PHOTO_FRAME_SRC)
    ])

    this.ctx.clearRect(0, 0, 2000, 2800)

    // 將 imgYour 不應顯示的空間填滿 (僅相框內保留透明)
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.drawImage(imgPhotoFrame, 0, 0, 2000, 2800)

    // 貼上 imgYour , 並把前一張圖清空
    this.ctx.globalCompositeOperation = 'source-out'
    this.ctx.drawImage(imgYour, 600, 1200, 550, 750)

    // 在 imgYour 的後方貼上相框後的圖片
    this.ctx.globalCompositeOperation = 'destination-over'
    this.ctx.drawImage(img15InFrame, 0, 0, 2000, 2800)

    // 在最前方貼上剩餘部分
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.drawImage(img15OutFrame, 0, 0, 2000, 2800)

    this.ctx.globalCompositeOperation = 'source-over'
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

window.clickDownloadButton = function () {
  const downloadElementA = document.createElement('a')
  downloadElementA.download = `15-with-you-${Date.now()}.png`
  downloadElementA.href = canvas.toDataURL()
  downloadElementA.click()
}

const canvas = new Canvas('canvas')
main()
