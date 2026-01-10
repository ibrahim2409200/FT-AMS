# ===========================
# ✅ Socket.IO related rules
# ===========================
-keep class io.socket.** { *; }
-keep interface io.socket.** { *; }
-dontwarn io.socket.**

# ===========================
# ✅ AsyncStorage & OneSignal (optional safety)
# ===========================
-keep class com.onesignal.** { *; }
-dontwarn com.onesignal.**
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# ===========================
# ✅ Prevent obfuscation of model classes (if any)
# ===========================
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# ===========================
# ✅ General rules to avoid stripping
# ===========================
-keepattributes Signature
-keepattributes *Annotation*
