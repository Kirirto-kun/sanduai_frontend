"use client";

import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";

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
        if (error.code === "auth/network-request-failed") {
          errorMessage += "Проверьте подключение к интернету и настройки Firebase. Убедитесь, что домен добавлен в Firebase Console.";
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += "Попробуйте обновить страницу.";
        }
        
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).code = error.code;
        reject(enhancedError);
      });
    } catch (error: any) {
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
  } catch (error: any) {
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
  try {
    await confirmationResult.confirm(code);
  } catch (error) {
    throw error;
  }
}

/**
 * Reset reCAPTCHA verifier
 */
export function resetRecaptcha(): void {
  if (recaptchaWidgetId !== null && typeof window !== "undefined" && (window as any).grecaptcha) {
    try {
      (window as any).grecaptcha.reset(recaptchaWidgetId);
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

