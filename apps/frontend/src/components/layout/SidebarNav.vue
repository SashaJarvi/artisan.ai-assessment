<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'grid', shortLabel: 'Dash' },
  { path: '/packages', label: 'Package Map', icon: 'package', shortLabel: 'Pkgs' }
]

const isActive = (path: string) => computed(() => route.path === path)
</script>

<template>
  <nav class="flex flex-col w-14 bg-surface-darker border-r border-surface-border shrink-0">
    <div class="flex items-center justify-center h-12 border-b border-surface-border">
      <span class="text-accent font-bold text-lg">C</span>
    </div>
    <div class="flex flex-col gap-1 p-2 flex-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
        :class="[
          isActive(item.path).value
            ? 'bg-accent/20 text-accent'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
        ]"
      >
        <!-- Active indicator bar -->
        <div
          v-if="isActive(item.path).value"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r"
        />
        <!-- Icon placeholder using text -->
        <svg
          v-if="item.icon === 'grid'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
        <svg
          v-else-if="item.icon === 'package'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <svg
          v-else-if="item.icon === 'git-branch'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M6 3v12m0 0a3 3 0 103 3 3 3 0 00-3-3zm12-6a3 3 0 10-3-3 3 3 0 003 3zm0 0v6a3 3 0 01-3 3H9"
          />
        </svg>
        <svg
          v-else-if="item.icon === 'activity'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M22 12h-4l-3 9L9 3l-3 9H2"
          />
        </svg>

        <!-- Tooltip -->
        <div class="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {{ item.label }}
        </div>
      </RouterLink>
    </div>
  </nav>
</template>
