<template>
  <v-dialog v-model="open" max-width="480" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon color="primary" class="mr-2">mdi-console</v-icon>
        Command-line login
      </v-card-title>

      <v-card-text>
        <div v-if="state === 'loading'" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else-if="state === 'pending'">
          <p class="mb-4">
            <strong>{{
              request?.client_name || "A command-line client"
            }}</strong>
            asks to sign in to dserver as you.
          </p>
          <p class="mb-2">
            Approve only if this code matches the one shown in your terminal:
          </p>
          <p
            class="text-headline-small text-center font-weight-bold my-4"
            data-test="user-code"
          >
            {{ userCode }}
          </p>
          <p v-if="expiresAt" class="text-body-small">
            Expires {{ expiresAt }}.
          </p>
        </template>

        <v-alert
          v-else-if="state === 'approved'"
          type="success"
          variant="tonal"
        >
          Login approved. You can return to the command line.
        </v-alert>

        <v-alert v-else-if="state === 'denied'" type="info" variant="tonal">
          Login denied.
        </v-alert>

        <v-alert
          v-else-if="state === 'error'"
          type="error"
          variant="tonal"
          data-test="error"
        >
          Could not process the login request for code {{ userCode }}:
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <template v-if="state === 'pending'">
          <v-btn
            variant="text"
            :disabled="busy"
            data-test="deny"
            @click="decide(false)"
          >
            Deny
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="busy"
            data-test="approve"
            @click="decide(true)"
          >
            Approve
          </v-btn>
        </template>
        <v-btn
          v-else-if="state !== 'loading'"
          variant="text"
          data-test="close"
          @click="close"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { oauth2DeviceUrl } from "@/config";
import {
  type DeviceRequest,
  clearPendingUserCode,
  decideDeviceRequest,
  getPendingUserCode,
  lookupDeviceRequest,
} from "@/services/deviceApproval";
import { useAuthStore } from "@/stores/auth";

type State = "loading" | "pending" | "approved" | "denied" | "error";

const auth = useAuthStore();

const userCode = ref<string | null>(getPendingUserCode());
const open = ref(userCode.value !== null);
const state = ref<State>("loading");
const request = ref<DeviceRequest | null>(null);
const error = ref("");
const busy = ref(false);

const expiresAt = computed(() =>
  request.value?.expires_at
    ? new Date(request.value.expires_at).toLocaleTimeString()
    : null,
);

function fail(e: unknown): void {
  error.value = e instanceof Error ? e.message : String(e);
  state.value = "error";
  // The code cannot be used anymore; do not ask again after a reload.
  clearPendingUserCode();
}

onMounted(async () => {
  if (userCode.value === null) {
    return;
  }
  try {
    request.value = await lookupDeviceRequest(
      userCode.value,
      auth.token ?? "",
      oauth2DeviceUrl,
    );
    if (request.value.status === "pending") {
      state.value = "pending";
    } else {
      fail(new Error(`Request already ${request.value.status}`));
    }
  } catch (e) {
    fail(e);
  }
});

async function decide(approve: boolean): Promise<void> {
  if (userCode.value === null) {
    return;
  }
  busy.value = true;
  try {
    await decideDeviceRequest(
      userCode.value,
      approve,
      auth.token ?? "",
      oauth2DeviceUrl,
    );
    state.value = approve ? "approved" : "denied";
    clearPendingUserCode();
  } catch (e) {
    fail(e);
  } finally {
    busy.value = false;
  }
}

function close(): void {
  clearPendingUserCode();
  open.value = false;
}
</script>
