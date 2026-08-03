"use client";

import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";
import { getErrorCode } from "./error-utils";

// Export ConfirmationResult type for use in components
export type { ConfirmationResult };

let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaWidgetId: number | null = null;

/**
 * Initialize reCAPTCHA verifier
 * @param containerId - ID of the container element for visible reCAPTCHA, or button ID for invisible
 * @param isInvisible - Whether to use invisible reCAPTCHA (default: true)
 * @param onSuccess - Callback when reCAPTCHA is solved
 * @param onExpired - Callback when reCAPTCHA expires
 */
export function initializeRecaptcha(
  containerId: string,
  isInvisible: boolean = true,
  onSuccess?: () => void,
  onExpired?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if DOM is ready
      if (typeof window === "undefined") {
        reject(new Error("Window is not available"));
        return;
      }

      // Check if container exists
      const container = document.getElementById(containerId);
      if (!container && !isInvisible) {
        reject(new Error(`Container with ID "${containerId}" not found`));
        return;
      }

      // Cleanup existing verifier if any
      cleanupRecaptcha();

      const options: {
        size: "invisible" | "normal";
        callback?: (response: string) => void;
        "expired-callback"?: () => void;
      } = {
        size: isInvisible ? "invisible" : "normal",
      };

      if (onSuccess) {
        options.callback = onSuccess;
      }

      if (onExpired) {
        options["expired-callback"] = onExpired;
      }

      // For invisible reCAPTCHA, we still need a container element
      // The containerId should be the ID of an existing DOM element
      recaptchaVerifier = new RecaptchaVerifier(
        auth,
        containerId,
        options
      );

      // Render reCAPTCHA with timeout
      const renderTimeout = setTimeout(() => {
        reject(new Error("reCAPTCHA render timeout. Check your network connection and Firebase configuration."));
      }, 10000); // 10 second timeout

      recaptchaVerifier.render().then((widgetId) => {
        clearTimeout(renderTimeout);
        recaptchaWidgetId = widgetId;
        resolve();
      }).catch((error) => {
        clearTimeout(renderTimeout);
        console.error("Error rendering reCAPTCHA:", error);
        
        // Provide more helpful error messages
        let errorMessage = "Ошибка загрузки reCAPTCHA. ";
        const errorCode = getErrorCode(error);
        if (errorCode === "auth/network-request-failed") {
          errorMessage += "Проверьте подключение к интернету и настройки Firebase. Убедитесь, что домен добавлен в Firebase Console.";
        } else if (error instanceof Error && error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += "Попробуйте обновить страницу.";
        }
        
        const enhancedError = Object.assign(new Error(errorMessage), { code: errorCode });
        reject(enhancedError);
      });
    } catch (error: unknown) {
      console.error("Error initializing reCAPTCHA:", error);
      reject(error);
    }
  });
}

/**
 * Send verification code to phone number
 * @param phoneNumber - Phone number in international format (e.g., +77012345678)
 */
export async function sendVerificationCode(
  phoneNumber: string
): Promise<ConfirmationResult> {
  if (!recaptchaVerifier) {
    throw new Error("reCAPTCHA verifier not initialized. Call initializeRecaptcha first.");
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error: unknown) {
    // Reset reCAPTCHA on error
    resetRecaptcha();
    throw error;
  }
}

/**
 * Verify the SMS code
 * @param confirmationResult - Result from sendVerificationCode
 * @param code - 6-digit verification code
 */
export async function verifyCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<void> {
  await confirmationResult.confirm(code);
}

/**
 * Reset reCAPTCHA verifier
 */
export function resetRecaptcha(): void {
  type RecaptchaWindow = Window & {
    grecaptcha?: { reset(widgetId?: number): void };
  };
  const grecaptcha = typeof window !== "undefined"
    ? (window as RecaptchaWindow).grecaptcha
    : undefined;
  if (recaptchaWidgetId !== null && grecaptcha) {
    try {
      grecaptcha.reset(recaptchaWidgetId);
    } catch (error) {
      console.error("Error resetting reCAPTCHA:", error);
    }
  }
}

/**
 * Cleanup reCAPTCHA verifier
 */
export function cleanupRecaptcha(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (error) {
      console.error("Error clearing reCAPTCHA:", error);
    }
    recaptchaVerifier = null;
  }
  recaptchaWidgetId = null;
}

/**
 * Check if reCAPTCHA is initialized
 */
export function isRecaptchaInitialized(): boolean {
  return recaptchaVerifier !== null;
}
