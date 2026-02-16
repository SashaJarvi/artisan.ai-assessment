import { ref } from 'vue'
import type { IHighlightedLine, IOutlineEntry, ISourceFile } from '@cpg-explorer/shared'
import { defineStore } from 'pinia'
import { fetchApi } from '@/api/client'

export const useSourceStore = defineStore('source', () => {
  const currentFile = ref<string | null>(null)
  const content = ref('')
  const pkg = ref('')
  const outline = ref<IOutlineEntry[]>([])
  const highlightedLines = ref<IHighlightedLine[]>([])
  const isLoading = ref(false)
  const scrollToLine = ref<number | null>(null)

  const fetchFile = async (file: string) => {
    if (file === currentFile.value && content.value) return

    isLoading.value = true
    try {
      const res = await fetchApi<{ data: ISourceFile }>('/source', { file })
      currentFile.value = res.data.file
      content.value = res.data.content
      pkg.value = res.data.package
    } catch {
      content.value = ''
    } finally {
      isLoading.value = false
    }
  }

  const fetchOutline = async (file: string) => {
    try {
      const res = await fetchApi<{ data: IOutlineEntry[] }>('/source/outline', { file })
      outline.value = res.data
    } catch {
      outline.value = []
    }
  }

  const setHighlightedLines = (lines: IHighlightedLine[]) => {
    highlightedLines.value = lines
  }

  const goToLine = (line: number) => {
    scrollToLine.value = line
  }

  const clearHighlights = () => {
    highlightedLines.value = []
  }

  return {
    currentFile,
    content,
    pkg,
    outline,
    highlightedLines,
    isLoading,
    scrollToLine,
    fetchFile,
    fetchOutline,
    setHighlightedLines,
    goToLine,
    clearHighlights
  }
})
