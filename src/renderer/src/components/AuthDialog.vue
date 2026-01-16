<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-tabs v-model="tab" grow color="primary">
        <v-tab value="login">Login</v-tab>
        <v-tab value="register">Register</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="login">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>
              <v-btn type="submit" block color="primary" :loading="loading" class="mt-4"
                >Login</v-btn
              >
            </v-form>
          </v-window-item>

          <v-window-item value="register">
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="email"
                label="Email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>
              <v-btn type="submit" block color="secondary" :loading="loading" class="mt-4"
                >Register</v-btn
              >
            </v-form>
          </v-window-item>
        </v-window>
        <v-alert v-if="error" type="error" dense class="mt-3">{{ error }}</v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'login-success'])

const dialog = ref(props.modelValue)
const tab = ref('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const authStore = useAuthStore()

watch(
  () => props.modelValue,
  (val) => {
    dialog.value = val
  }
)

watch(dialog, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    email.value = ''
    password.value = ''
    error.value = ''
  }
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  const res = await authStore.login(email.value, password.value)
  loading.value = false
  if (res.success) {
    emit('login-success')
    dialog.value = false
  } else {
    error.value = res.error || 'Login failed'
  }
}

async function handleRegister() {
  loading.value = true
  error.value = ''
  const res = await authStore.register(email.value, password.value)
  loading.value = false
  if (res.success) {
    emit('login-success')
    dialog.value = false
  } else {
    error.value = res.error || 'Registration failed'
  }
}
</script>
