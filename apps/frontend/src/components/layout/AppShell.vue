<script setup lang="ts">
import HeaderBar from './HeaderBar.vue'
import SidebarNav from './SidebarNav.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <SidebarNav />
    <div class="flex flex-col flex-1 min-w-0">
      <HeaderBar />
      <main class="flex-1 overflow-hidden">
        <Suspense>
          <template #default>
            <RouterView />
          </template>
          <template #fallback>
            <div class="flex items-center justify-center h-full">
              <div class="text-gray-500 text-sm">
                Loading...
              </div>
            </div>
          </template>
        </Suspense>
      </main>
    </div>
  </div>
</template>
