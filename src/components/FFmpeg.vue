<template>
  <div id="app">
    <input type="file" accept="video/*" @change="handleFileUpload" />
    
    <label for="resolution">Choose Resolution (16:9):</label>
    <select v-model="selectedResolution">
      <option value="7680:4320">4320p (7680x4320)</option>
      <option value="5120:2880">2880p (5120x2880)</option>
      <option value="3840:2160">2160p (3840x2160)</option>
      <option value="2560:1440">1440p (2560x1440)</option>
      <option value="1920:1080" selected>1080p (1920x1080) - default</option>
      <option value="1600:900">900p (1600x900)</option>
      <option value="1366:768">768p (1366x768)</option>
      <option value="1280:720">720p (1280x720)</option>
    </select>

    <video v-if="uploadedVideo" :src="uploadedVideo" controls style="max-width: 100%; margin-top: 10px;" />
    <br />
    <button @click="transcode" :disabled="!selectedFile">Start</button>
    <p>{{ message }}</p>

    <h2>Processed Video:</h2>
    <video v-if="processedVideo" :src="processedVideo" controls style="max-width: 100%; margin-top: 10px;" />
  </div>
</template>

<script lang="ts">
import { FFmpeg } from '@ffmpeg/ffmpeg'
import type { LogEvent } from '@ffmpeg/ffmpeg/dist/esm/types'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { defineComponent, ref } from 'vue'

//const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

export default defineComponent({
  name: 'App',
  setup() {
    const ffmpeg = new FFmpeg()
    const message = ref('Select a file and resolution, then click Start')
    const uploadedVideo = ref<string | null>(null)
    const processedVideo = ref<string | null>(null)
    const selectedFile = ref<File | null>(null)
    const selectedResolution = ref<string>('1920:1080')

    // 파일 업로드 처리
    const handleFileUpload = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        selectedFile.value = file
        uploadedVideo.value = URL.createObjectURL(file)
        message.value = 'File uploaded. Ready to process.'
      }
    }

    // 해상도 변경 및 비디오 처리
    const transcode = async () => {
      if (!selectedFile.value) {
        message.value = 'Please upload a video file first.'
        return
      }

      message.value = 'Loading ffmpeg-core.js'
      ffmpeg.on('log', ({ message: msg }: LogEvent) => {
        message.value = msg
      })

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })

      message.value = 'Start transcoding'

      const inputFileName = selectedFile.value.name
      const outputFileName = 'output.mp4'

      const [width, height] = selectedResolution.value.split(':').map(Number)

      await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile.value))

      // FFmpeg 명령 실행: 해상도 변경
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vf', `scale=${width}:${height},setsar=1,crop=${width}:${Math.round(width * height / width)}`, 
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'copy',
        outputFileName
      ])

      message.value = 'Complete transcoding'

      const data = await ffmpeg.readFile(outputFileName)
      processedVideo.value = URL.createObjectURL(
        new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' })
      )
    }

    return {
      uploadedVideo,
      processedVideo,
      message,
      handleFileUpload,
      transcode,
      selectedFile,
      selectedResolution,
    }
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
