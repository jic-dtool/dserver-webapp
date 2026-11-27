<template>
  <div class="dependencies-section">
    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <v-icon size="48" color="error" class="mb-2">mdi-alert-circle</v-icon>
      <p class="text-body-medium text-error">{{ error }}</p>
      <v-btn
        size="small"
        variant="tonal"
        color="primary"
        class="mt-2"
        @click="loadGraph"
      >
        Retry
      </v-btn>
    </div>

    <!-- Empty state (no dependencies) -->
    <div v-else-if="edges.length === 0" class="text-center py-8">
      <v-icon size="48" color="grey-lighten-1" class="mb-2">
        mdi-graph-outline
      </v-icon>
      <p class="text-body-medium">No recorded dependencies</p>
      <p class="text-body-small text-medium-emphasis">
        Datasets record what they were derived from in their README, e.g.
        <code>derived_from: [{uuid: ...}]</code>.
      </p>
    </div>

    <!-- Graph: datasets left to right, from sources to derived datasets -->
    <template v-else>
      <div ref="graphContainer" class="graph-container">
        <VueFlow
          :key="currentUuid ?? ''"
          :nodes="nodes"
          :edges="flowEdges"
          :nodes-draggable="false"
          :nodes-connectable="false"
          :elements-selectable="false"
          :min-zoom="0.2"
          :max-zoom="2"
          @pane-ready="onPaneReady"
          @nodes-initialized="frame"
          @node-click="onNodeClick"
        >
          <template #node-dataset="{ data }">
            <Handle type="target" :position="Position.Left" />
            <div
              class="dataset-node"
              :class="{
                'dataset-node--current': data.isCurrent,
                'dataset-node--filtered-out': isFilteredOut(data),
              }"
              :title="nodeTitle(data)"
            >
              <div class="dataset-node__name">{{ data.dataset.name }}</div>
              <div class="dataset-node__meta">
                {{ data.dataset.creator_username }} ·
                {{ formatDate(data.dataset.frozen_at) }}
              </div>
            </div>
            <Handle type="source" :position="Position.Right" />
          </template>
          <Controls :show-interactive="false" />
        </VueFlow>
      </div>
      <div class="graph-legend mt-2 text-body-small text-medium-emphasis">
        <span
          ><span class="legend-node legend-node--current" /> This dataset</span
        >
        <span
          >A <span class="legend-arrow">&rarr;</span> B: B was derived from
          A</span
        >
        <span v-if="matchingUuids"
          ><span class="legend-node legend-node--filtered-out" /> Not in the
          current filter</span
        >
        <span>Click a dataset to open it</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { VueFlow, Handle, Position, MarkerType } from "@vue-flow/core";
import type { NodeMouseEvent, VueFlowStore } from "@vue-flow/core";
import { Controls } from "@vue-flow/controls";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import { useStore } from "@/store";
import { formatDate } from "@/utils/dateUtils";
import { dserverApi } from "@/services/dserverApi";
import { useAuthStore } from "@/stores/auth";
import { buildSearchQuery, findMatchingUuids } from "@/services/filterMatches";
import type { SearchFilter } from "@/services/filterMatches";
import type { GraphDatasetEntry } from "@/services/dserverApi";
import {
  layoutDependencyGraph,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "@/utils/dependencyLayout";
import type { DatasetNodeData } from "@/utils/dependencyLayout";

const emit = defineEmits<{
  (e: "select-dataset", dataset: GraphDatasetEntry): void;
}>();

const store = useStore();
const auth = useAuthStore();

const loading = ref(false);
const error = ref<string | null>(null);
const graphData = ref<GraphDatasetEntry[]>([]);

const currentUuid = computed(() => store.current_dataset?.uuid ?? null);

const layout = computed(() =>
  layoutDependencyGraph(graphData.value, currentUuid.value),
);
const nodes = computed(() => layout.value.nodes);
const edges = computed(() => layout.value.edges);
const flowEdges = computed(() =>
  edges.value.map((edge) => ({
    ...edge,
    type: "smoothstep",
    markerEnd: MarkerType.ArrowClosed,
  })),
);

// --- search filter: datasets outside it are shown, but disabled ---

const filter = computed<SearchFilter>(() => ({
  query: buildSearchQuery(store),
  mongoText: store.mongo_text,
}));

// UUIDs in the graph that match the filter; null if no filter is active (or
// the check failed: then nothing is disabled).
const matchingUuids = ref<Set<string> | null>(null);

async function matchFilter(
  data: GraphDatasetEntry[],
): Promise<Set<string> | null> {
  try {
    return await findMatchingUuids(
      data.map((dataset) => dataset.uuid),
      filter.value,
      auth.token,
    );
  } catch (err) {
    console.error("Failed to apply the search filter to the graph:", err);
    return null;
  }
}

// A changed filter: update the graph shown, without reloading it.
let filterSequence = 0;
async function rematch(): Promise<void> {
  const sequence = ++filterSequence;
  const data = graphData.value;
  const matches = await matchFilter(data);
  if (sequence === filterSequence && graphData.value === data)
    matchingUuids.value = matches;
}
const filterKey = computed(() => JSON.stringify(filter.value));
watch(filterKey, rematch);

function isFilteredOut(data: DatasetNodeData): boolean {
  return (
    !data.isCurrent &&
    matchingUuids.value !== null &&
    !matchingUuids.value.has(data.dataset.uuid)
  );
}

watch(
  currentUuid,
  async (uuid) => {
    if (uuid) await loadGraph();
  },
  { immediate: true },
);

async function loadGraph(): Promise<void> {
  const uuid = currentUuid.value;
  if (!uuid) return;

  loading.value = true;
  error.value = null;
  try {
    // The server's dependency keys.
    const data = await dserverApi.getDependencyGraph(uuid);
    // Shown together with the graph, so no dataset flashes up as clickable.
    const key = filterKey.value;
    const matches = await matchFilter(data);
    // Discard the response if another dataset was selected meanwhile.
    if (currentUuid.value !== uuid) return;
    graphData.value = data;
    matchingUuids.value = matches;
    // The filter changed while loading.
    if (filterKey.value !== key) void rematch();
  } catch (err) {
    if (currentUuid.value !== uuid) return;
    console.error("Failed to load dependency graph:", err);
    error.value = "Failed to load dependency graph";
    graphData.value = [];
  } finally {
    if (currentUuid.value === uuid) loading.value = false;
  }
}

// --- framing: show the whole graph if readable, else the current dataset ---

const MIN_READABLE_ZOOM = 0.75;
const graphContainer = ref<HTMLDivElement | null>(null);
let flow: VueFlowStore | null = null;

function onPaneReady(instance: VueFlowStore): void {
  flow = instance;
  frame();
}

async function frame(): Promise<void> {
  if (!flow || nodes.value.length === 0) return;
  await flow.fitView({ padding: 0.1, maxZoom: 1 });
  if (flow.viewport.value.zoom >= MIN_READABLE_ZOOM) return;
  // Too large to read at once: centre on the current dataset (pan or zoom
  // out for the rest).
  const current = nodes.value.find((node) => node.data.isCurrent);
  if (!current) return;
  await flow.setCenter(
    current.position.x + NODE_WIDTH / 2,
    current.position.y + NODE_HEIGHT / 2,
    { zoom: MIN_READABLE_ZOOM },
  );
}

// The container gets its size only once the tab is shown, and changes it
// with the window.
const resizeObserver =
  typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(() => requestAnimationFrame(() => frame()));
watch(graphContainer, (container, previous) => {
  if (previous) resizeObserver?.unobserve(previous);
  if (container) resizeObserver?.observe(container);
});
onUnmounted(() => resizeObserver?.disconnect());

function onNodeClick({ node }: NodeMouseEvent): void {
  const data = node.data as DatasetNodeData;
  if (!data.isCurrent && !isFilteredOut(data))
    emit("select-dataset", data.dataset);
}

function nodeTitle(data: DatasetNodeData): string {
  const title = `${data.dataset.name}\n${data.dataset.uri}`;
  return isFilteredOut(data) ? `${title}\n(not in the current filter)` : title;
}
</script>

<style scoped>
.dependencies-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-container {
  position: relative;
  flex: 1;
  min-height: 460px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.dataset-node {
  width: 220px;
  height: 64px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.4);
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.dataset-node:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.dataset-node--current {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  cursor: default;
}

.dataset-node--current:hover {
  background: rgb(var(--v-theme-primary));
}

.dataset-node--filtered-out {
  border-style: dashed;
  border-color: rgba(var(--v-theme-on-surface), 0.3);
  color: rgba(var(--v-theme-on-surface), 0.45);
  cursor: default;
}

.dataset-node--filtered-out:hover {
  background: rgb(var(--v-theme-surface));
}

.dataset-node__name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dataset-node__meta {
  font-size: 11px;
  opacity: 0.75;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Fill the container (which has a min-height, not a height). */
.graph-container > :deep(.vue-flow) {
  position: absolute;
  inset: 0;
}

/* The datasets are the nodes; Vue Flow's default node frame is not needed. */
:deep(.vue-flow__node-dataset) {
  padding: 0;
  border: none;
  background: transparent;
}

:deep(.vue-flow__handle) {
  opacity: 0;
  pointer-events: none;
}

:deep(.vue-flow__edge-path) {
  stroke: rgba(var(--v-theme-on-surface), 0.45);
  stroke-width: 1.5;
}

.graph-legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-node {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  vertical-align: middle;
  margin-right: 4px;
}

.legend-node--current {
  background: rgb(var(--v-theme-primary));
}

.legend-node--filtered-out {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.45);
}

.legend-arrow {
  font-size: 14px;
}
</style>
