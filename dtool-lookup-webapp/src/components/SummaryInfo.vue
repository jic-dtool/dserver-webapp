<template>
  <div class="summary-sidebar">
    <!-- Header -->
    <div class="pa-4 bg-primary">
      <h6 class="text-h6 text-white font-weight-medium">
        <v-icon start>mdi-folder-search</v-icon>
        Repository
      </h6>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="errored" class="pa-4">
      <v-alert type="error" density="compact" class="mb-2">
        Unable to load summary information please try again.
      </v-alert>
      <v-btn size="small" color="secondary" @click="load_summary()">
        Try again
      </v-btn>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Dataset counts summary -->
      <div class="pa-4 border-b">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2 text-grey-darken-1">Total Datasets</span>
          <v-chip size="small" color="primary" variant="flat">
            {{ summary_info?.number_of_datasets ?? 0 }}
          </v-chip>
        </div>
        <div class="d-flex justify-space-between align-center">
          <span class="text-body-2 text-grey-darken-1">Filtered</span>
          <v-chip size="small" color="secondary" variant="flat">
            {{ store.num_filtered }}
          </v-chip>
        </div>
        <v-btn
          block
          variant="tonal"
          color="primary"
          size="small"
          class="mt-3"
          prepend-icon="mdi-filter-off"
          @click="clearFilters()"
        >
          Clear All Filters
        </v-btn>
      </div>

      <!-- Locations filter, always open: the storage locations of the
           datasets, with their dserver URIs for the command line -->
      <div
        v-if="summary_info?.base_uris && summary_info.base_uris.length > 0"
        class="border-b"
      >
        <div
          class="d-flex align-center px-6 pt-4 pb-1 text-body-2 font-weight-medium"
        >
          <v-icon start size="small">mdi-folder-marker</v-icon>
          Locations
          <v-spacer />
          <v-badge
            v-if="store.base_uris.length > 0"
            :content="store.base_uris.length"
            color="primary"
            inline
          />
        </div>
        <v-list
          density="compact"
          class="pt-0 pb-2 px-4"
          max-height="300"
          style="overflow-y: auto"
        >
          <v-list-item
            v-for="base_uri in summary_info.base_uris"
            :key="base_uri"
            class="px-0"
            @click="toggleBaseUri(base_uri)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="store.base_uris.includes(base_uri)"
                density="compact"
                hide-details
                @click.stop="toggleBaseUri(base_uri)"
              />
            </template>
            <v-list-item-title class="text-body-2" :title="base_uri">
              {{ base_uri }}
            </v-list-item-title>
            <template #append>
              <v-chip size="x-small" color="grey-lighten-1" variant="flat">
                {{ summary_info.datasets_per_base_uri[base_uri] }}
              </v-chip>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    color="primary"
                    class="ml-1"
                    aria-label="Copy URI"
                    @click.stop="copyUri(locationUri(base_uri))"
                  />
                </template>
                <div class="text-caption">
                  <div class="font-weight-medium">Copy URI</div>
                  <code>{{ locationUri(base_uri) }}</code>
                  <div v-if="isDserverUri(locationUri(base_uri))">
                    e.g. <code>dtool ls {{ locationUri(base_uri) }}</code> after
                    <code>{{ login_command }}</code>
                  </div>
                </div>
              </v-tooltip>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Further filters -->
      <v-expansion-panels variant="accordion" multiple>
        <!-- Tags Filter -->
        <v-expansion-panel
          v-if="summary_info?.tags && summary_info.tags.length > 0"
        >
          <v-expansion-panel-title class="text-body-2 font-weight-medium">
            <v-icon start size="small">mdi-tag-multiple</v-icon>
            Tags
            <template #actions="{ expanded }">
              <v-badge
                v-if="store.tags.length > 0"
                :content="store.tags.length"
                color="primary"
                inline
                class="mr-2"
              />
              <v-icon
                :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              />
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list
              density="compact"
              class="py-0"
              max-height="200"
              style="overflow-y: auto"
            >
              <v-list-item
                v-for="(tag, index) in summary_info.tags"
                :key="index"
                @click="toggleTag(tag)"
                class="px-0"
              >
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="store.tags.includes(tag)"
                    density="compact"
                    hide-details
                    @click.stop="toggleTag(tag)"
                  />
                </template>
                <v-list-item-title class="text-body-2">{{
                  tag
                }}</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" color="grey-lighten-1" variant="flat">
                    {{ summary_info.datasets_per_tag[tag] }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Creators Filter -->
        <v-expansion-panel
          v-if="
            summary_info?.creator_usernames &&
            summary_info.creator_usernames.length > 0
          "
        >
          <v-expansion-panel-title class="text-body-2 font-weight-medium">
            <v-icon start size="small">mdi-account-multiple</v-icon>
            Creators
            <template #actions="{ expanded }">
              <v-badge
                v-if="store.creator_usernames.length > 0"
                :content="store.creator_usernames.length"
                color="primary"
                inline
                class="mr-2"
              />
              <v-icon
                :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              />
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list
              density="compact"
              class="py-0"
              max-height="200"
              style="overflow-y: auto"
            >
              <v-list-item
                v-for="(creator, index) in summary_info.creator_usernames"
                :key="index"
                @click="toggleCreator(creator)"
                class="px-0"
              >
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="store.creator_usernames.includes(creator)"
                    density="compact"
                    hide-details
                    @click.stop="toggleCreator(creator)"
                  />
                </template>
                <v-list-item-title class="text-body-2">{{
                  creator
                }}</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" color="grey-lighten-1" variant="flat">
                    {{ summary_info.datasets_per_creator[creator] }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Uploaders Filter (server-asserted registration identity) -->
        <v-expansion-panel
          v-if="summary_info?.uploaders && summary_info.uploaders.length > 0"
        >
          <v-expansion-panel-title class="text-body-2 font-weight-medium">
            <v-icon start size="small">mdi-account-arrow-up</v-icon>
            Uploaders
            <template #actions="{ expanded }">
              <v-badge
                v-if="store.uploaded_by.length > 0"
                :content="store.uploaded_by.length"
                color="primary"
                inline
                class="mr-2"
              />
              <v-icon
                :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              />
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list
              density="compact"
              class="py-0"
              max-height="200"
              style="overflow-y: auto"
            >
              <v-list-item
                v-for="(uploader, index) in summary_info.uploaders"
                :key="index"
                @click="toggleUploader(uploader)"
                class="px-0"
              >
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="store.uploaded_by.includes(uploader)"
                    density="compact"
                    hide-details
                    @click.stop="toggleUploader(uploader)"
                  />
                </template>
                <v-list-item-title class="text-body-2">{{
                  uploader
                }}</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" color="grey-lighten-1" variant="flat">
                    {{ summary_info.datasets_per_uploader?.[uploader] }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useStore } from "@/store";
import { dserverApi } from "@/services/dserverApi";
import type { SummaryInfo } from "@/services/dserverApi";
import { useNotificationStore } from "@/stores/notifications";
import { dserverUri, loginCommand } from "@/utils/dtoolCommand";

const emit = defineEmits<{
  (e: "start-search"): void;
}>();

const store = useStore();
const notifications = useNotificationStore();

const login_command = loginCommand();

const summary_info = ref<SummaryInfo | null>(null);
const loading = ref(true);
const errored = ref(false);

async function load_summary(): Promise<void> {
  errored.value = false;
  loading.value = true;
  try {
    summary_info.value = await dserverApi.getMySummary();
  } catch (error) {
    console.log(error);
    errored.value = true;
  } finally {
    loading.value = false;
  }
}

function searchDatasets(): void {
  store.current_pageNumber = 1;
  emit("start-search");
}

function clearFilters(): void {
  store.clearAll();
  store.current_pageNumber = 1;
  emit("start-search");
}

function toggleTag(tag: string): void {
  store.updateTags(
    store.tags.includes(tag)
      ? store.tags.filter((t) => t !== tag)
      : [...store.tags, tag],
  );
  searchDatasets();
}

// With the signed URL plugin, the dtool command line accesses storage
// locations through dserver (dtool-dserver).
function locationUri(base_uri: string): string {
  if (store.hasSignedUrlPlugin) {
    return dserverUri(base_uri) ?? base_uri;
  }
  return base_uri;
}

function isDserverUri(uri: string): boolean {
  return uri.startsWith("dserver://");
}

async function copyUri(uri: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(uri);
    notifications.success(`Copied ${uri}`);
  } catch (error) {
    console.error("Failed to copy:", error);
    notifications.error("Failed to copy to clipboard");
  }
}

function toggleBaseUri(base_uri: string): void {
  store.updateBaseUris(
    store.base_uris.includes(base_uri)
      ? store.base_uris.filter((u) => u !== base_uri)
      : [...store.base_uris, base_uri],
  );
  searchDatasets();
}

function toggleCreator(creator: string): void {
  store.updateCreatorUsernames(
    store.creator_usernames.includes(creator)
      ? store.creator_usernames.filter((c) => c !== creator)
      : [...store.creator_usernames, creator],
  );
  searchDatasets();
}

function toggleUploader(uploader: string): void {
  store.updateUploadedBy(
    store.uploaded_by.includes(uploader)
      ? store.uploaded_by.filter((u) => u !== uploader)
      : [...store.uploaded_by, uploader],
  );
  searchDatasets();
}

onMounted(() => {
  load_summary();
});
</script>

<style scoped>
.summary-sidebar {
  height: 100%;
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
