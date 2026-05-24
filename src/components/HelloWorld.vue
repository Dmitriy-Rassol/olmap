<template>
  <div class="map-page">
    <ol-map
      ref="mapRef"
      class="map"
      :class="{ 'map--dragging': isDraggingNewPoint }"
      @click="onMapClick"
    >
      <button class="legend-toggle" type="button" @click.stop="isLegendOpen = !isLegendOpen">
        Статусы точек
      </button>

      <div v-if="isLegendOpen" class="legend" @click.stop>
        <div v-for="item in legendItems" :key="item.label" class="legend-item">
          <div class="legend-color-wrapper" :style="{ background: item.color }">
            <div class="legend-color-inner" :style="{ background: item.color }" />
          </div>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <ol-view :center="center" :zoom="19" />

      <ol-zoom-control />
      <ol-scale-line-control />

      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>

      <!-- Граница кладбища -->
      <ol-vector-layer :z-index="1">
        <ol-source-vector>
          <ol-feature>
            <ol-geom-polygon :coordinates="cemeteryPolygon" />
            <ol-style>
              <ol-style-fill color="rgba(0,0,0,0)" />
              <ol-style-stroke color="#00695C" :width="2" />
            </ol-style>
          </ol-feature>
        </ol-source-vector>
      </ol-vector-layer>

      <!-- Карты -->
      <ol-vector-layer :z-index="2">
        <ol-source-vector>
          <ol-feature
            v-for="card in cards"
            :key="card.card_id"
            :properties="{ cardId: card.card_id, cardName: card.card_name }"
          >
            <ol-geom-polygon :coordinates="card.coordinates.coordinates" />
            <ol-style>
              <ol-style-fill color="rgba(0, 137, 123, 0.08)" />
              <ol-style-stroke color="#00695C" :width="2" />
              <ol-style-text :text="card.card_name" />
            </ol-style>
          </ol-feature>
        </ol-source-vector>
      </ol-vector-layer>

      <!-- Выбранная карта -->
      <ol-vector-layer v-if="selectedCard" :z-index="100">
        <ol-source-vector>
          <ol-feature>
            <ol-geom-polygon :coordinates="selectedCard.coordinates.coordinates" />
            <ol-style>
              <ol-style-fill color="rgba(255, 179, 0, 0.22)" />
              <ol-style-stroke color="rgba(230, 81, 0, 1)" :width="2" />
            </ol-style>
          </ol-feature>
        </ol-source-vector>
      </ol-vector-layer>

      <!-- Обычные точки -->
      <ol-vector-layer :z-index="200">
        <ol-source-vector>
          <template v-for="burial in normalBurialPoints" :key="burial.burial_id">
            <ol-feature>
              <ol-geom-polygon
                :coordinates="getCirclePolygon(
                  burial.burial_coordinates.coordinates,
                  0.0000085
                )"
              />
              <ol-style>
                <ol-style-fill :color="getPointColor(burial.pointType)" />
              </ol-style>
            </ol-feature>

            <ol-feature>
              <ol-geom-polygon
                :coordinates="getCirclePolygon(
                  burial.burial_coordinates.coordinates,
                  0.000008
                )"
              />
              <ol-style>
                <ol-style-fill color="#ffffff" />
              </ol-style>
            </ol-feature>

            <ol-feature
              :properties="{
                pointId: burial.burial_id,
                pointType: burial.pointType,
                burial
              }"
            >
              <ol-geom-polygon
                :coordinates="getCirclePolygon(
                  burial.burial_coordinates.coordinates,
                  0.0000065
                )"
              />
              <ol-style>
                <ol-style-fill :color="getPointColor(burial.pointType)" />
              </ol-style>
            </ol-feature>
          </template>
        </ol-source-vector>
      </ol-vector-layer>

      <!-- Подсветка выбранной точки -->
      <ol-vector-layer v-if="selectedPoint" :z-index="299">
        <ol-source-vector>
          <ol-feature v-for="radius in selectedPointGlowRadii" :key="radius">
            <ol-geom-polygon
              :coordinates="getCirclePolygon(
                selectedPoint.burial_coordinates.coordinates,
                radius
              )"
            />
            <ol-style>
              <ol-style-fill color="rgba(255, 194, 0, 0.2)" />
            </ol-style>
          </ol-feature>
        </ol-source-vector>
      </ol-vector-layer>

      <!-- Выбранная точка -->
      <ol-vector-layer v-if="selectedPoint" :z-index="300">
        <ol-source-vector>
          <ol-feature>
            <ol-geom-polygon
              :coordinates="getCirclePolygon(
                selectedPoint.burial_coordinates.coordinates,
                0.0000085
              )"
            />
            <ol-style>
              <ol-style-fill :color="getPointColor(selectedPoint.pointType)" />
            </ol-style>
          </ol-feature>

          <ol-feature>
            <ol-geom-polygon
              :coordinates="getCirclePolygon(
                selectedPoint.burial_coordinates.coordinates,
                0.000008
              )"
            />
            <ol-style>
              <ol-style-fill color="#ffffff" />
            </ol-style>
          </ol-feature>

          <ol-feature
            :properties="{
              pointId: selectedPoint.burial_id,
              pointType: selectedPoint.pointType,
              burial: selectedPoint
            }"
          >
            <ol-geom-polygon
              :coordinates="getCirclePolygon(
                selectedPoint.burial_coordinates.coordinates,
                0.0000065
              )"
            />
            <ol-style>
              <ol-style-fill :color="getPointColor(selectedPoint.pointType)" />
            </ol-style>
          </ol-feature>
        </ol-source-vector>
      </ol-vector-layer>

      <!-- Новая точка -->
      <ol-vector-layer v-if="newPoint && newPointCoordinates" :z-index="400">
        <ol-source-vector>
          <ol-feature :properties="{ isNewPoint: true }">
            <ol-geom-polygon :coordinates="getCirclePolygon(newPointCoordinates, 0.00008)" />
            <ol-style>
              <ol-style-fill color="rgba(255, 109, 0, 0.22)" />
              <ol-style-stroke color="rgba(255, 109, 0, 1)" :width="1" />
            </ol-style>
          </ol-feature>

          <ol-feature :properties="{ isNewPoint: true }">
            <ol-geom-polygon :coordinates="getCirclePolygon(newPointCoordinates, 0.000016)" />
            <ol-style>
              <ol-style-fill color="rgba(0,0,0,0)" />
              <ol-style-stroke
                color="rgba(255, 109, 0, 1)"
                :width="1"
                :line-dash="[4, 4]"
              />
            </ol-style>
          </ol-feature>

          <ol-feature :properties="{ isNewPoint: true }">
            <ol-geom-polygon :coordinates="getCirclePolygon(newPointCoordinates, 0.000025)" />
            <ol-style>
              <ol-style-fill color="rgba(0,0,0,0)" />
              <ol-style-stroke
                color="rgba(255, 109, 0, 1)"
                :width="1"
                :line-dash="[4, 4]"
              />
            </ol-style>
          </ol-feature>

          <ol-feature :properties="{ isNewPoint: true }">
            <ol-geom-polygon :coordinates="getCirclePolygon(newPointCoordinates, 0.0000085)" />
            <ol-style>
              <ol-style-fill color="rgba(21, 101, 192, 1)" />
            </ol-style>
          </ol-feature>

          <ol-feature :properties="{ isNewPoint: true }">
            <ol-geom-polygon :coordinates="getCirclePolygon(newPointCoordinates, 0.000008)" />
            <ol-style>
              <ol-style-fill color="#ffffff" />
            </ol-style>
          </ol-feature>

          <ol-feature
            :properties="{
              pointId: newPoint.burial_id,
              pointType: newPoint.pointType,
              burial: newPoint,
              isNewPoint: true
            }"
          >
            <ol-geom-polygon :coordinates="getCirclePolygon(newPointCoordinates, 0.0000065)" />
            <ol-style>
              <ol-style-fill color="rgba(21, 101, 192, 1)" />
            </ol-style>
          </ol-feature>
        </ol-source-vector>
      </ol-vector-layer>
    </ol-map>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

import type Map from 'ol/Map'
import DragPan from 'ol/interaction/DragPan'

import { cemetery } from '../cemetery'
import { burials121 } from '../burials121'

type Coordinate = [number, number]

type PointType =
  | 'new'
  | 'my_inventory'
  | 'other_inventory'
  | 'registry_no_photo'
  | 'registry_with_photo'
  | 'public_burial'
  | 'unknown_burial'
  | 'need_redo'
  | 'rejected'
  | 'processing'

const mapRef = ref<any>(null)

const legendItems = [
  { label: 'Новая точка', color: 'rgba(21, 101, 192, 1)' },
  { label: 'Мои точки инвентаризации', color: 'rgba(21, 101, 192, 1)' },
  { label: 'Чужие точки инвентаризации', color: 'rgba(138, 178, 224, 1)' },
  { label: 'Точка из реестра, без фото', color: 'rgba(129, 199, 132, 1)' },
  { label: 'Точка из реестра, с фото', color: 'rgba(46, 125, 50, 1)' },
  { label: 'Публичное захоронение', color: 'rgba(158, 0, 226, 1)' },
  { label: 'Неопознанное захоронение', color: 'rgba(128, 128, 128, 1)' },
  { label: 'Необходимо переделать', color: 'rgba(254, 36, 41, 1)' },
  { label: 'Отклонено при обработке', color: 'rgba(56, 56, 56, 1)' },
  { label: 'В обработке', color: 'rgba(255, 194, 0, 1)' },
]

const selectedCardId = ref<number | null>(null)
const selectedPointId = ref<number | null>(null)
const isLegendOpen = ref(false)

const isDraggingNewPoint = ref(false)
const wasDraggingNewPoint = ref(false)

const dragOffset = ref<Coordinate | null>(null)

let olMapInstance: Map | null = null
let viewportElement: HTMLElement | null = null

const center = cemetery.coordinates_center.coordinates
const cemeteryPolygon = cemetery.coordinates.coordinates
const cards = cemetery.card_list

const pointColors: Record<PointType, string> = {
  new: 'rgba(21, 101, 192, 1)',
  my_inventory: 'rgba(21, 101, 192, 1)',
  other_inventory: 'rgba(138, 178, 224, 1)',
  registry_no_photo: 'rgba(129, 199, 132, 1)',
  registry_with_photo: 'rgba(46, 125, 50, 1)',
  public_burial: 'rgba(158, 0, 226, 1)',
  unknown_burial: 'rgba(128, 128, 128, 1)',
  need_redo: 'rgba(254, 36, 41, 1)',
  rejected: 'rgba(56, 56, 56, 1)',
  processing: 'rgba(255, 194, 0, 1)',
}

const selectedPointGlowRadii = [
  0.000014,
  0.0000135,
  0.000013,
  0.0000125,
  0.000012,
]

const selectedCard = computed(() => {
  return cards.find(card => card.card_id === selectedCardId.value) || null
})

const burialPoints = computed(() => {
  return burials121
    .filter(burial => burial.card_id === 121)
    .map(burial => ({
      ...burial,
      pointType: burial.status as PointType,
    }))
})

const newPoint = computed(() => {
  return burialPoints.value.find(
    burial => burial.pointType === 'new'
  ) || null
})

const newPointCoordinates = ref<Coordinate | null>(null)

watchEffect(() => {
  if (!newPoint.value || newPointCoordinates.value) return

  const coords = newPoint.value.burial_coordinates.coordinates

  newPointCoordinates.value = [
    Number(coords[0] ?? 0),
    Number(coords[1] ?? 0),
  ]
})

const selectedPoint = computed(() => {
  return burialPoints.value.find(
    burial => burial.burial_id === selectedPointId.value
  ) || null
})

const normalBurialPoints = computed(() => {
  return burialPoints.value.filter(
    burial =>
      burial.burial_id !== selectedPointId.value &&
      burial.pointType !== 'new'
  )
})

onMounted(async () => {
  await nextTick()

  olMapInstance = (mapRef.value?.map ?? null) as unknown as Map | null

  if (!olMapInstance) return

  viewportElement = olMapInstance.getViewport()

  viewportElement.addEventListener('mousedown', onNativeMouseDown)

  viewportElement.addEventListener(
    'touchstart',
    onNativeTouchStart,
    { passive: false }
  )

  window.addEventListener('mousemove', onNativeMouseMove)
  window.addEventListener('mouseup', onNativeMouseUp)

  window.addEventListener(
    'touchmove',
    onNativeTouchMove,
    { passive: false }
  )

  window.addEventListener('touchend', onNativeTouchEnd)
  window.addEventListener('touchcancel', onNativeTouchEnd)
})

onBeforeUnmount(() => {
  setMapDragPanActive(true)

  viewportElement?.removeEventListener('mousedown', onNativeMouseDown)
  viewportElement?.removeEventListener('touchstart', onNativeTouchStart)

  window.removeEventListener('mousemove', onNativeMouseMove)
  window.removeEventListener('mouseup', onNativeMouseUp)

  window.removeEventListener('touchmove', onNativeTouchMove)
  window.removeEventListener('touchend', onNativeTouchEnd)
  window.removeEventListener('touchcancel', onNativeTouchEnd)

  viewportElement = null
  olMapInstance = null
})

function setMapDragPanActive(active: boolean) {
  if (!olMapInstance) return

  olMapInstance.getInteractions().forEach(interaction => {
    if (interaction instanceof DragPan) {
      interaction.setActive(active)
    }
  })
}

function getCirclePolygon(
  coords: number[] | Coordinate,
  radius = 0.00001,
  segments = 64
): Coordinate[][] {
  const lng = Number(coords[0] ?? 0)
  const lat = Number(coords[1] ?? 0)

  const ring: Coordinate[] = []

  const latRad = (lat * Math.PI) / 180
  const lngRadius = radius / Math.cos(latRad)

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2

    ring.push([
      lng + Math.cos(angle) * lngRadius,
      lat + Math.sin(angle) * radius,
    ])
  }

  return [ring]
}

function getPointColor(type: PointType) {
  return pointColors[type]
}

function getEventCoordinate(event: MouseEvent | Touch) {
  if (!olMapInstance) return null

  return olMapInstance.getEventCoordinate(
    event as unknown as MouseEvent
  ) as Coordinate
}

function isEventNearNewPoint(event: MouseEvent | Touch) {
  if (!olMapInstance) return false

  const pixel = olMapInstance.getEventPixel(
    event as unknown as UIEvent
  )

  const feature = olMapInstance.forEachFeatureAtPixel(
    pixel,
    (feature: any) => feature,
    {
      hitTolerance: 10,
    }
  )

  return !!feature?.get('isNewPoint')
}

function setNewPointCoordinateByDomEvent(event: MouseEvent | Touch) {
  const coordinate = getEventCoordinate(event)

  if (!coordinate) return

  const offset = dragOffset.value || [0, 0]

  newPointCoordinates.value = [
    coordinate[0] + offset[0],
    coordinate[1] + offset[1],
  ]
}

function startDragNewPoint(event: MouseEvent | Touch) {
  if (!isEventNearNewPoint(event)) {
    return false
  }

  const eventCoordinate = getEventCoordinate(event)

  if (!eventCoordinate || !newPointCoordinates.value) {
    return false
  }

  dragOffset.value = [
    newPointCoordinates.value[0] - eventCoordinate[0],
    newPointCoordinates.value[1] - eventCoordinate[1],
  ]

  isDraggingNewPoint.value = true
  wasDraggingNewPoint.value = true

  selectedCardId.value = null
  selectedPointId.value = null

  setMapDragPanActive(false)

  return true
}

function moveDragNewPoint(event: MouseEvent | Touch) {
  if (!isDraggingNewPoint.value) return

  setNewPointCoordinateByDomEvent(event)
}

function stopDragNewPoint(event?: MouseEvent | Touch) {
  if (!isDraggingNewPoint.value) return

  if (event) {
    setNewPointCoordinateByDomEvent(event)
  }

  isDraggingNewPoint.value = false
  dragOffset.value = null

  setMapDragPanActive(true)

  console.log('Новая координата:', newPointCoordinates.value)

  window.setTimeout(() => {
    wasDraggingNewPoint.value = false
  }, 150)
}

function onNativeMouseDown(event: MouseEvent) {
  if (event.button !== 0) return

  const started = startDragNewPoint(event)

  if (!started) return

  event.preventDefault()
  event.stopPropagation()
}

function onNativeMouseMove(event: MouseEvent) {
  if (!isDraggingNewPoint.value) return

  moveDragNewPoint(event)

  event.preventDefault()
  event.stopPropagation()
}

function onNativeMouseUp(event: MouseEvent) {
  if (!isDraggingNewPoint.value) return

  stopDragNewPoint(event)

  event.preventDefault()
  event.stopPropagation()
}

function onNativeTouchStart(event: TouchEvent) {
  const touch = event.touches[0]

  if (!touch) return

  const started = startDragNewPoint(touch)

  if (!started) return

  event.preventDefault()
  event.stopPropagation()
}

function onNativeTouchMove(event: TouchEvent) {
  if (!isDraggingNewPoint.value) return

  const touch = event.touches[0]

  if (!touch) return

  moveDragNewPoint(touch)

  event.preventDefault()
  event.stopPropagation()
}

function onNativeTouchEnd(event: TouchEvent) {
  if (!isDraggingNewPoint.value) return

  const touch = event.changedTouches[0]

  stopDragNewPoint(touch)

  event.preventDefault()
  event.stopPropagation()
}

function onMapClick(event: any) {
  if (isDraggingNewPoint.value || wasDraggingNewPoint.value) return

  if (!olMapInstance) {
    olMapInstance = event.map as unknown as Map
  }

  const feature = event.map.forEachFeatureAtPixel(
    event.pixel,
    (feature: any) => feature,
    {
      hitTolerance: 10,
    }
  )

  if (!feature) {
    selectedCardId.value = null
    selectedPointId.value = null
    return
  }

  if (feature.get('isNewPoint')) {
    selectedPointId.value = null
    selectedCardId.value = null
    return
  }

  const pointId = feature.get('pointId')

  if (pointId) {
    selectedPointId.value = pointId
    selectedCardId.value = null
    return
  }

  const cardId = feature.get('cardId')

  if (cardId) {
    selectedCardId.value = cardId
    selectedPointId.value = null
  }
}
</script>

<style scoped>
.map-page {
  width: 100%;
  max-width: 1200px;
  height: 100vh;
  margin: 0 auto;
  padding: 12px;
  box-sizing: border-box;
}

.map {
  width: 100%;
  height: calc(100vh - 24px);
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  touch-action: none;
}

.map--dragging {
  cursor: grabbing;
}

.legend-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  background: #ffffff;
  color: #111827;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.legend {
  position: absolute;
  top: 68px;
  right: 20px;
  z-index: 1000;
  width: 300px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #374151;
}

.legend-color-wrapper {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.legend-color-inner {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid #ffffff;
}
</style>