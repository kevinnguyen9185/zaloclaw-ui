/**
 * Persistent device identity and request state storage.
 *
 * Stores device credentials (ID, keys) and request state to avoid:
 * - Pairing churn (reuse approved device, don't create new requests each run)
 * - Request ID collisions (persist counter across sessions)
 * - Re-authentication loops (store and reuse deviceToken)
 */

/* eslint-disable @typescript-eslint/no-require-imports */

export interface DeviceState {
  deviceId: string;
  publicKey: string;
  privateKey: string;
  deviceToken?: string;
  requestIdCounter: number;
  updatedAt: number;
}

class DeviceStorage {
  private readonly STORAGE_KEY = "zaloclaw.device";
  private cache: DeviceState | null = null;

  /**
   * Load device state from storage.
   * Returns persisted state or null if not found.
   */
  load(): DeviceState | null {
    // Try in-memory cache first
    if (this.cache) {
      return this.cache;
    }

    // Try browser localStorage (client-side)
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.cache = JSON.parse(stored);
          return this.cache;
        }
      } catch (error) {
        console.warn("Failed to load device state from localStorage", error);
      }
    }

    // Try Node.js file system (server-side or Node tests)
    if (typeof window === "undefined") {
      try {
        // eslint-disable-next-line global-require
        const fs = require("fs");
        // eslint-disable-next-line global-require
        const path = require("path");
        const storagePath = this.getNodeStoragePath();
        if (fs.existsSync(storagePath)) {
          const content = fs.readFileSync(storagePath, "utf-8");
          this.cache = JSON.parse(content);
          return this.cache;
        }
      } catch (error) {
        // Silently handle missing file or require errors in browser environment
        if (
          error instanceof Error &&
          !error.message.includes("Cannot find module")
        ) {
          console.warn("Failed to load device state from file system", error);
        }
      }
    }

    return null;
  }

  /**
   * Save device state to storage.
   * Works in both browser (localStorage) and Node.js (file system).
   */
  save(state: DeviceState): void {
    this.cache = state;

    // Save to browser localStorage
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn("Failed to save device state to localStorage", error);
      }
    }

    // Save to Node.js file system
    if (typeof window === "undefined") {
      try {
        // eslint-disable-next-line global-require
        const fs = require("fs");
        // eslint-disable-next-line global-require
        const path = require("path");
        const storagePath = this.getNodeStoragePath();
        const dir = path.dirname(storagePath);

        // Ensure directory exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(storagePath, JSON.stringify(state, null, 2));
      } catch (error) {
        console.warn("Failed to save device state to file system", error);
      }
    }
  }

  /**
   * Clear all stored device state.
   */
  clear(): void {
    this.cache = null;

    // Clear browser localStorage
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {
        console.warn("Failed to clear device state from localStorage", error);
      }
    }

    // Clear Node.js file system
    if (typeof window === "undefined") {
      try {
        // eslint-disable-next-line global-require
        const fs = require("fs");
        const storagePath = this.getNodeStoragePath();
        if (fs.existsSync(storagePath)) {
          fs.unlinkSync(storagePath);
        }
      } catch (error) {
        console.warn("Failed to clear device state from file system", error);
      }
    }
  }

  /**
   * Get or initialize device state.
   * Creates new state if not found, increments requestIdCounter if found.
   */
  getOrInit(
    deviceId: string,
    publicKey: string,
    privateKey: string
  ): DeviceState {
    const state = this.load();

    if (state) {
      // Update existing state with new credentials (in case they changed)
      state.deviceId = deviceId;
      state.publicKey = publicKey;
      state.privateKey = privateKey;
      state.updatedAt = Date.now();
      // Keep existing requestIdCounter to avoid collisions
      this.save(state);
      return state;
    }

    // Initialize new device state
    const newState: DeviceState = {
      deviceId,
      publicKey,
      privateKey,
      requestIdCounter: 1,
      updatedAt: Date.now(),
    };

    this.save(newState);
    return newState;
  }

  /**
   * Update deviceToken (called after successful connect handshake).
   */
  updateToken(deviceToken: string): DeviceState | null {
    const state = this.load();
    if (state) {
      state.deviceToken = deviceToken;
      state.updatedAt = Date.now();
      this.save(state);
      return state;
    }
    return null;
  }

  /**
   * Get next request ID and increment counter.
   */
  getNextRequestId(): number {
    const state = this.load();
    if (!state) {
      throw new Error(
        "Device state not initialized. Call getOrInit first."
      );
    }

    const id = state.requestIdCounter;
    state.requestIdCounter++;
    this.save(state);

    return id;
  }

  /**
   * Determine file path for Node.js storage.
   * Uses .tmp-zaloclaw-device.json in project root.
   */
  private getNodeStoragePath(): string {
    // eslint-disable-next-line global-require
    const path = require("path");
    return path.join(process.cwd(), ".tmp-zaloclaw-device.json");
  }
}

export const deviceStorage = new DeviceStorage();
