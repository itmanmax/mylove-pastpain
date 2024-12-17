<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import gsap from 'gsap'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const canvasRef = ref(null)
let scene, camera, renderer, controls, composer
let updateSnow

// 添加音频引用
const audioRef = ref(null)
const isPlaying = ref(false)  // 默认关闭

// 添加加载状态控制
const isLoading = ref(true)
const loadingProgress = ref(0)
const modelLoaded = ref(false)
const texturesLoaded = ref(false)

// 创建加载管理器
const loadingManager = new THREE.LoadingManager(
  // 加载完成
  () => {
    isLoading.value = false
  },
  // 加载进度
  (url, itemsLoaded, itemsTotal) => {
    loadingProgress.value = (itemsLoaded / itemsTotal) * 100
  }
)

const props = defineProps({
  name: {
    type: String,
    default: 'max'  // 默认值
  },
  loved: {
    type: String,
    default: 'max'  // 默认值
  }
})

const initScene = () => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000033) // 深蓝色背景
  
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 30, 160)  // 设置初始位置为正对告示牌
  camera.lookAt(0, 25, 40)

  renderer = new THREE.WebGLRenderer({ 
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ReinhardToneMapping
  
  // 基础环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  scene.add(ambientLight)

  // 主光源
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.5)
  mainLight.position.set(10, 30, 10)
  scene.add(mainLight)

  // 添加聚光灯照亮树顶
  const spotLight = new THREE.SpotLight(0xffffff, 2.0) // 增加亮度
  spotLight.position.set(0, 100, 30) // 从高处照射
  spotLight.target.position.set(0, 0, 0) // 对准树的中心
  spotLight.angle = Math.PI / 6 // 光束角度
  spotLight.penumbra = 0.2 // 边缘柔和度
  spotLight.decay = 1 // ��衰减
  spotLight.distance = 200 // 光照距离
  spotLight.castShadow = true // 投阴影

  // 调整阴影质量
  spotLight.shadow.mapSize.width = 2048
  spotLight.shadow.mapSize.height = 2048
  spotLight.shadow.camera.near = 10
  spotLight.shadow.camera.far = 200
  spotLight.shadow.focus = 1

  scene.add(spotLight)
  scene.add(spotLight.target)

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 80
  controls.maxDistance = 400
  controls.minPolarAngle = Math.PI * 0.2
  controls.maxPolarAngle = Math.PI * 0.8
  controls.target.set(0, 25, 40)
  
  // 初始时禁用控制器
  controls.enabled = false

  // 修改初始旋转动画
  const startRotation = () => {
    const radius = camera.position.distanceTo(new THREE.Vector3(0, 25, 40))  // 到目标点的距离
    
    // 添加2秒延迟
    setTimeout(() => {
      const startTime = Date.now()
      
      gsap.to({}, {
        duration: 9,
        onUpdate: () => {
          const progress = (Date.now() - startTime) / 9000  // 0 到 1 的进度
          const angle = progress * Math.PI * 2  // 0 到 2π
          
          // 计算相机位置
          camera.position.x = Math.sin(angle) * radius
          camera.position.z = 160 * Math.cos(angle)  // 保持初始z距离
          camera.lookAt(0, 25, 40)  // 始终看向告示牌
        },
        onComplete: () => {
          // 动画完成后，确保相机回到正面位置
          camera.position.set(0, 30, 160)
          camera.lookAt(0, 25, 40)
          controls.enabled = true  // 启用控制器
        },
        ease: "none"  // 使用线性缓动实现匀速旋转
      })
    }, 2000)  // 2秒延迟
  }

  startRotation()

  // 后期
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,    // 降低整体强度
    0.2,    // 保持发光半径
    0.5     // 提高阈值，减少杂散光
  )
  composer.addPass(bloomPass)

  // 修改地面材质
  const ground = createGround()
  scene.add(ground)

  // 添加积雪层
  const snowLayerGeometry = new THREE.CircleGeometry(400, 64)
  const snowLayerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,  // 降低不透明度
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
    emissive: 0xffffff,
    emissiveIntensity: 0.05,  // 降低发光强度
    blending: THREE.NormalBlending  // 改用普通混合模式
  })

  const snowLayer = new THREE.Mesh(snowLayerGeometry, snowLayerMaterial)
  snowLayer.rotation.x = -Math.PI / 2
  snowLayer.position.y = -1.99  // 略高于地面
  snowLayer.receiveShadow = true

  // 添加雪花纹理
  const noiseTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMTItMTZUMTE6MzU6NDcrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMTItMTZUMTE6MzU6NDcrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTEyLTE2VDExOjM1OjQ3KzA4OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ODg3ZWQxLTQ5ZDAtNDM5Yy1hMmE1LTNlYmVjOGQ5OGE1YyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjIyYzRlMzVhLTJmMzQtNDM0ZC1hNmE1LTYxZjNmMzY0YzE0YiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ODg3ZWQxLTQ5ZDAtNDM5Yy1hMmE1LTNlYmVjOGQ5OGE1YyIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ODg3ZWQxLTQ5ZDAtNDM5Yy1hMmE1LTNlYmVjOGQ5OGE1YyIgc3RFdnQ6d2hlbj0iMjAyMy0xMi0xNlQxMTozNTo0NyswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+yjqTzwAAAYdJREFUWIXtl79KxEAQxn93noqCYGFhYWNhYWHlA1gJFhYWFhYWFhYWFhYWFhYWFhYWPoYgCIIgCMIhyPkw7kz+3CT7B24Dw0Ky+803M7szyVYiQg7CMB0wqzX9/f2lXEIp5Yw/8YmPGEopvPcLNQgh0HUd3nvquqau67nxzjm6rqNpGpqmWajRNA1t29I0zVz/tm3x3tO27bj2lPcMw0DTNKNvVVVUVTX+V0pR1zVVVSGS9hEppZRzjrZtcc4tDQQwxiAixBhzzYUQiDGilEJrjTFmvBMRYoyjRinFMAyEEOZqxBiJMWKMQWuN1hqlFNZarLVL+SilKKXMNkAphbUWrTXOOZxzxBiJMRJjHEG01oyA1tpxnfcepRTee0II8/0ppbDWYq3FGDMCGmMwxmCMwVo7ghtjsNaO4EopjDHjXK31uNZaO4IbY7DWLgHO5Z8AzgVYWvv3AHOJlPsKcnvBJmfgkwO4xGZnDrBxwFwbzwLkNuIpwNxmvBTgtwQfAXzajN8W4BsncqQHwXKqeAAAAABJRU5ErkJggg==')
  noiseTexture.wrapS = THREE.RepeatWrapping
  noiseTexture.wrapT = THREE.RepeatWrapping
  noiseTexture.repeat.set(20, 20)  // 增加重复次数，使纹理更细腻
  snowLayerMaterial.alphaMap = noiseTexture
  snowLayerMaterial.needsUpdate = true

  // 调整积雪的环境光
  const snowLight = new THREE.AmbientLight(0xffffff, 0.1)  // 降低环境强度
  scene.add(snowLight)

  // 调整从上方打下来的柔和聚光灯
  const snowSpotLight = new THREE.SpotLight(0xffffff, 0.2)  // 降低强度
  snowSpotLight.position.set(0, 50, 0)
  snowSpotLight.target = snowLayer
  snowSpotLight.angle = Math.PI / 3
  snowSpotLight.penumbra = 1
  snowSpotLight.decay = 2  // 增加衰减
  scene.add(snowSpotLight)

  // 添加一些随机的雪堆效果
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 350 + 20
    const snowPileGeometry = new THREE.CircleGeometry(Math.random() * 20 + 5, 32)
    const snowPileMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.1
    })
    const snowPile = new THREE.Mesh(snowPileGeometry, snowPileMaterial)
    snowPile.rotation.x = -Math.PI / 2
    snowPile.position.set(
      Math.cos(angle) * radius,
      -1.98,
      Math.sin(angle) * radius
    )
    snowPile.receiveShadow = true
    scene.add(snowPile)
  }

  // 修改地面环境光色和强度
  const groundLight = new THREE.AmbientLight(0xD2B48C, 0.1)  // 更和的光照
  scene.add(groundLight)

  // 添加一个从上方打下来的聚光灯，增加面的光泽感
  const floorSpotLight = new THREE.SpotLight(0xffffff, 0.3)
  floorSpotLight.position.set(0, 50, 0)
  floorSpotLight.target = ground
  floorSpotLight.angle = Math.PI / 3
  floorSpotLight.penumbra = 0.8
  scene.add(floorSpotLight)

  // 使用加载管理器创建加载器
  const loader = new GLTFLoader(loadingManager)
  const textureLoader = new THREE.TextureLoader(loadingManager)

  // 预加载所有纹理
  const texturesToLoad = [
    '/models/christmas_tree.glb',
    // 添加其他需要预加载的纹理
  ]

  Promise.all(texturesToLoad.map(url => 
    new Promise((resolve) => textureLoader.load(url, resolve))
  )).then(() => {
    texturesLoaded.value = true
  })

  // 加载模型
  loader.load('models/christmas_tree.glb', 
    (gltf) => {
      const tree = gltf.scene
      
      // 遍历模型中的所有材质
      tree.traverse((child) => {
        if (child.isMesh && child.material) {
          // 默认不发光
          child.material.emissive = new THREE.Color(0x000000)
          child.material.emissiveIntensity = 0
          
          // 暖黄色灯带
          if(child.material.name === 'lichter') {
            child.material.emissive = new THREE.Color(0xffa500)
            child.material.emissiveIntensity = 3.0
            child.material.toneMapped = false
            
            const lightStrip = new THREE.PointLight(0xffa500, 1.0, 10)
            lightStrip.position.copy(child.position)
            scene.add(lightStrip)
          }
          
          // 装饰球
          if(child.name.startsWith('pSphere')) {
            child.material.emissive = child.material.color
            child.material.emissiveIntensity = 1.0
            child.material.toneMapped = false
          }

          // 金色五角星
          if(child.name === 'pCylinder3_lambert6_0') {
            child.material.emissive = new THREE.Color(0xffd700)
            child.material.emissiveIntensity = 2.5
            child.material.toneMapped = false
            
            const starLight = new THREE.PointLight(0xffd700, 1.5, 15)
            starLight.position.copy(child.position)
            starLight.position.y += 1
            scene.add(starLight)
          }
        }
      })

      scene.add(tree)

      // 创建告示牌
      const signboard = createSignboard()
      scene.add(signboard)

      // 添加告示牌动画
      gsap.to(signboard.rotation, {
        y: 0.05,  // 减小旋转角度
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      })

      // 添加上下浮动动画
      gsap.to(signboard.position, {
        y: signboard.position.y + 1,  // 减小浮动高度
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      })
      modelLoaded.value = true
      // 只有在模型加载完成后才开始动画
      startRotation()
    }
  )

  // 创建雪花系统并获取更新函数
  updateSnow = createSnowSystem()
}

// 创建雪花系统函数移到外面
const createSnowSystem = () => {
  const snowflakeCount = 4000
  const snowGeometry = new THREE.BufferGeometry()
  const snowPositions = []
  const snowSizes = []
  const snowSpeeds = []
  const snowRotations = []

  // 创建雪花粒子
  for (let i = 0; i < snowflakeCount; i++) {
    snowPositions.push(
      Math.random() * 800 - 400,
      Math.random() * 400,
      Math.random() * 800 - 400
    )

    // 随机决定是大雪花还是小雪花
    const isLargeSnow = Math.random() > 0.7  // 30%概率是大雪花
    if (isLargeSnow) {
      // 大雪花: 0.6-0.8
      snowSizes.push(Math.random() * 0.2 + 0.6)
      // 大雪花下落更快
      snowSpeeds.push(Math.random() * 0.3 + 0.2)
    } else {
      // 小雪花: 0.1-0.3 (保持原的大小)
      snowSizes.push(Math.random() * 0.2 + 0.1)
      // 小雪花下落更慢
      snowSpeeds.push(Math.random() * 0.15 + 0.1)
    }

    snowRotations.push(Math.random() * Math.PI * 2)
  }

  snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowPositions, 3))
  snowGeometry.setAttribute('size', new THREE.Float32BufferAttribute(snowSizes, 1))

  // 调整粒子材质
  const snowMaterial = new THREE.PointsMaterial({
    size: 0.5,
    transparent: true,
    opacity: 0.7,  // 略微增加透明度
    color: 0xffffff,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })

  // 创建雪花系统
  const snow = new THREE.Points(snowGeometry, snowMaterial)
  scene.add(snow)

  return function update() {
    const positions = snowGeometry.attributes.position.array

    for (let i = 0; i < snowflakeCount; i++) {
      const i3 = i * 3
      
      // 下落
      positions[i3 + 1] -= snowSpeeds[i]
      
      // 添加更自然的摆动效果
      positions[i3] += Math.sin(Date.now() * 0.001 + snowRotations[i]) * 0.05
      positions[i3 + 2] += Math.cos(Date.now() * 0.002 + snowRotations[i]) * 0.05
      
      // 如果雪花落到地面以下，重置到顶部
      if (positions[i3 + 1] < -20) {
        positions[i3 + 1] = 300
        positions[i3] = Math.random() * 600 - 300
        positions[i3 + 2] = Math.random() * 600 - 300
      }
    }

    snowGeometry.attributes.position.needsUpdate = true
  }
}

// 动画循环
const animate = () => {
  requestAnimationFrame(animate)
  if (controls.enabled) {
    controls.update()
  }
  if (updateSnow) {
    updateSnow()
  }
  composer.render()
}

const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  initScene()
  animate()
  window.addEventListener('resize', handleResize)

  // 初始化音频
  const audio = new Audio()
  audio.src = '/background.mp3'  // 确保路径正确
  audioRef.value = audio
  audio.loop = true
  audio.preload = 'auto'
  
  // 音频加载成功处理
  audio.addEventListener('canplaythrough', () => {
    console.log('Audio loaded successfully')
    audio.volume = 0.5
  })

  // 详细的错误处理
  audio.addEventListener('error', (e) => {
    const error = e.target.error
    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        console.error('Audio loading aborted')
        break
      case error.MEDIA_ERR_NETWORK:
        console.error('Audio loading failed due to network error')
        break
      case error.MEDIA_ERR_DECODE:
        console.error('Audio decoding failed')
        break
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        console.error('Audio format not supported')
        break
      default:
        console.error('Audio loading failed with error:', error)
    }
  })

  // 添加加载状态监听
  audio.addEventListener('loadstart', () => console.log('Audio loading started'))
  audio.addEventListener('progress', () => console.log('Audio loading in progress'))
  audio.addEventListener('loadeddata', () => console.log('Audio data loaded'))
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
})

// 修改地面部分的代码
// 创建更自然的地效果
const createGround = () => {
  // 主地面
  const groundGeometry = new THREE.CircleGeometry(400, 128)
  
  // 创建渐变纹理 - 调整颜色过渡
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, '#8B4513')    // 中心深棕色
  gradient.addColorStop(0.2, '#DEB887')  // 更快地过渡到浅木色
  gradient.addColorStop(0.4, '#FFFFFF')  // 更早开始雪白色
  gradient.addColorStop(1, '#FFFFFF')    // 边缘纯白
  
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  
  const groundTexture = new THREE.CanvasTexture(canvas)
  groundTexture.wrapS = THREE.RepeatWrapping
  groundTexture.wrapT = THREE.RepeatWrapping
  groundTexture.repeat.set(4, 4)

  // 创建更明显的凹凸贴图
  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = 128
  bumpCanvas.height = 128
  const bumpContext = bumpCanvas.getContext('2d')
  
  // 创建更的雪堆纹理
  bumpContext.fillStyle = '#000000'
  bumpContext.fillRect(0, 0, 128, 128)
  
  // 增加雪堆数量和大小
  for (let i = 0; i < 150; i++) {  // 增加雪堆数量
    const x = Math.random() * 128
    const y = Math.random() * 128
    const radius = Math.random() * 25 + 8  // 增加雪堆大小
    
    const gradient = bumpContext.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, '#FFFFFF')
    gradient.addColorStop(0.5, '#FFFFFF')  // 使雪堆更加明显
    gradient.addColorStop(1, '#000000')
    
    bumpContext.fillStyle = gradient
    bumpContext.beginPath()
    bumpContext.arc(x, y, radius, 0, Math.PI * 2)
    bumpContext.fill()
  }

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas)
  bumpTexture.wrapS = THREE.RepeatWrapping
  bumpTexture.wrapT = THREE.RepeatWrapping
  bumpTexture.repeat.set(8, 8)

  // 调整地面材质
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: groundTexture,
    bumpMap: bumpTexture,
    bumpScale: 2,  // 增加凸效果
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -2
  ground.receiveShadow = true

  // 强地面照
  const groundLight = new THREE.AmbientLight(0xffffff, 0.3)  // 增加环境光强度
  scene.add(groundLight)

  const groundSpotLight = new THREE.SpotLight(0xffffff, 0.6)  // 增加聚光灯强度
  groundSpotLight.position.set(0, 50, 0)
  groundSpotLight.target = ground
  groundSpotLight.angle = Math.PI / 3
  groundSpotLight.penumbra = 1
  groundSpotLight.decay = 1.5
  scene.add(groundSpotLight)

  // 修改文字提示部分
  const createBottomText = () => {
    const textGeometry = new THREE.PlaneGeometry(800, 60)  // 进一步增加宽度
    
    const canvas = document.createElement('canvas')
    canvas.width = 6144  // 增加分辨率
    canvas.height = 1024
    const context = canvas.getContext('2d')
    
    context.clearRect(0, 0, canvas.width, canvas.height)
    
    // 减小字体大小
    context.font = '260px Arial'  // 进一步减小字体
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    
    // 添加文字描边以提高可读性
    context.strokeStyle = '#000000'
    context.lineWidth = 8
    context.strokeText('你已经旋转到底部了--max出品，认真去爱', canvas.width / 2, canvas.height / 2)
    
    context.fillStyle = '#ffffff'
    context.fillText('你已经旋转到底部了--max出品，认真去爱', canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })

    const textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.rotation.x = Math.PI / 2
    textMesh.position.y = -15
    
    // 优化动画性能
    const animate = () => {
      if (!textMesh.material) return
      
      const opacity = camera.position.y < -20 
        ? Math.min(0.8, (-20 - camera.position.y) / 25)
        : 0
      
      if (textMesh.material.opacity !== opacity) {
        textMesh.material.opacity = opacity
      }
      
      requestAnimationFrame(animate)
    }
    animate()

    return textMesh
  }

  const bottomText = createBottomText()
  scene.add(bottomText)

  return ground
}

// 创建告示牌
const createSignboard = () => {
  // 创建主组
  const sign = new THREE.Group()
  sign.position.set(0, 25, 40)

  // 修改中心文字区域材质
  const centerPlaneGeo = new THREE.PlaneGeometry(38, 28)
  const centerMaterial = new THREE.MeshBasicMaterial({
    color: 0x222222,  // 深灰色背景
    side: THREE.DoubleSide
  })
  const centerPlane = new THREE.Mesh(centerPlaneGeo, centerMaterial)
  centerPlane.position.z = 0
  sign.add(centerPlane)

  // 建文字
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const context = canvas.getContext('2d')

  // 设置深色背景
  context.fillStyle = '#222222'
  context.fillRect(0, 0, canvas.width, canvas.height)

  // 设置文字样式
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  
  // 第一行文字
  context.font = 'bold 150px Arial'
  context.shadowColor = '#ff0000'
  context.shadowBlur = 5
  context.shadowOffsetX = 0
  context.shadowOffsetY = 0
  
  context.strokeStyle = '#ff0000'
  context.lineWidth = 3
  const text1 = `${props.loved} 圣诞快乐！`
  context.strokeText(text1, canvas.width/2, canvas.height/3)
  
  context.shadowBlur = 0
  context.fillStyle = '#ff3333'
  context.fillText(text1, canvas.width/2, canvas.height/3)

  // 第二行文字 - 调整发光效果
  context.shadowColor = '#00ffff'
  context.shadowBlur = 2  // 减小模糊半径
  
  // 先绘制外描边
  context.strokeStyle = '#00ffff'
  context.lineWidth = 2  // 减小描边宽度
  const text2 = `${props.name} 爱你！`
  
  // 多次描边，创建清晰的轮廓
  for (let i = 0; i < 3; i++) {
    context.strokeText(text2, canvas.width/2, canvas.height*2/3)
  }
  
  // 清除阴影后绘制主文字
  context.shadowBlur = 0
  context.fillStyle = '#00ffff'
  context.fillText(text2, canvas.width/2, canvas.height*2/3)

  // 创建文字纹理
  const texture = new THREE.CanvasTexture(canvas)
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
  })

  // 创建文字平面
  const textGeometry = new THREE.PlaneGeometry(37, 27)  // 略小于中心区域
  const textMesh = new THREE.Mesh(textGeometry, textMaterial)
  textMesh.position.z = 0.1  // 略微在前面
  sign.add(textMesh)

  // 创建发光边框 - 使用线框而不是实体
  const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(40, 30, 0.5))
  const borderMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    linewidth: 2,
    transparent: true,
    opacity: 0.8
  })
  const border = new THREE.LineSegments(borderGeo, borderMat)
  sign.add(border)

  // 创建支柱 - 修改为黑紫色
  const poleGeometry = new THREE.BoxGeometry(4, 40, 4)
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a0033,  // 深黑紫色底色
    emissive: 0x330066,  // 紫色发光
    emissiveIntensity: 0.5,  // 增加发光强度
    metalness: 0.8,
    roughness: 0.2
  })
  const pole = new THREE.Mesh(poleGeometry, poleMaterial)
  pole.position.set(0, -20, -2)
  
  // 添加支柱的发���果
  const poleLight = new THREE.PointLight(0x330066, 0.8, 8)
  poleLight.position.set(0, -10, 0)
  pole.add(poleLight)
  
  sign.add(pole)

  // 添加边缘发光效果
  const edgeLight1 = new THREE.PointLight(0x00ffff, 1, 10)
  edgeLight1.position.set(20, 0, 0)
  sign.add(edgeLight1)

  const edgeLight2 = new THREE.PointLight(0x00ffff, 1, 10)
  edgeLight2.position.set(-20, 0, 0)
  sign.add(edgeLight2)

  // 添加呼吸效果
  gsap.to([edgeLight1, edgeLight2], {
    intensity: 0.3,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  })

  // 修改告示牌动画的时序
  const startBoardAnimation = () => {
    // 等待2秒后开始旋转动画
    setTimeout(() => {
      gsap.to(sign.rotation, {
        y: 0.05,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      })

      gsap.to(sign.position, {
        y: sign.position.y + 1,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      })
    }, 5000)  // 2秒延迟
  }

  startBoardAnimation()
  return sign
}

// 修改音频控制函数
const toggleAudio = async () => {
  try {
    const audio = audioRef.value
    if (!audio) {
      console.warn('Audio not initialized')
      return
    }

    if (audio.paused) {
      try {
        await audio.play()
        isPlaying.value = true
        console.log('Audio playing')
      } catch (playError) {
        console.error('Failed to play audio:', playError)
      }
    } else {
      audio.pause()
      isPlaying.value = false
      console.log('Audio paused')
    }
  } catch (error) {
    console.error('Error in audio control:', error)
  }
}
</script>

<template>
  <div class="christmas-scene">
    <!-- 加载界面 -->
    <div 
      v-if="isLoading" 
      class="loading-screen fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50"
    >
      <div class="text-center">
        <div class="text-4xl text-white mb-8">🎄 圣诞快乐 🎄</div>
        <div class="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            class="h-full bg-red-500 transition-all duration-300"
            :style="{ width: `${loadingProgress}%` }"
          ></div>
        </div>
        <div class="text-white mt-4">
          {{ Math.round(loadingProgress) }}%
        </div>
        <div class="text-white/60 text-sm mt-2">
          正在准备你的圣诞祝福...
        </div>
      </div>
    </div>

    <!-- 主场景 -->
    <canvas ref="canvasRef"></canvas>
    <button 
      class="audio-control"
      @click="toggleAudio()"
    >
      {{ isPlaying ? '🔇' : '🔊' }}
    </button>
  </div>
</template>

<style scoped>
.christmas-scene {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, #000033 0%, #000066 100%);
}

canvas {
  width: 100%;
  height: 100%;
}

.audio-control {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.audio-control:hover {
  background: rgba(255, 255, 255, 0.3);
}

.loading-screen {
  background: linear-gradient(to bottom, #000033, #000066);
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.loading-screen .text-4xl {
  animation: pulse 2s infinite;
}
</style> 