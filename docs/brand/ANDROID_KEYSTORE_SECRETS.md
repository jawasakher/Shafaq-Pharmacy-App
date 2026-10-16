# إعداد بيئة البناء الفعلي (Production Keystore Secrets)

لضمان إمكانية تحديث التطبيق للمستخدمين الحاليين دون ظهور خطأ "تضارب التوقيع" (Signature Mismatch) عند تثبيت الـ APK، تم تعديل خط الإنتاج (GitHub Actions) ليقبل حقن مفتاح التوقيع الفعلي (Production Keystore) الخاص بشَفَق مباشرة أثناء عملية البناء.

يُرجى إنشاء المتغيرات السرية (Secrets) التالية في مسار `Settings > Secrets and variables > Actions > Repository secrets` على GitHub:

1. **`ANDROID_KEYSTORE_BASE64`**:
   - محتوى ملف الـ Keystore الفعلي الخاص بالتطبيق مشفراً بصيغة Base64.
   - *طريقة الاستخراج (على نظام Mac/Linux):* 
     `base64 -i my-release-key.keystore | pbcopy`
   - *طريقة الاستخراج (على نظام Windows/GitBash):*
     `openssl base64 -A -in my-release-key.keystore -out base64.txt` (ثم انسخ محتوى الملف وضعْه في جيتهاب).

2. **`ANDROID_KEYSTORE_PASSWORD`**:
   - كلمة المرور الخاصة بملف الـ Keystore.

3. **`ANDROID_KEY_ALIAS`**:
   - الاسم التعريفي (Alias) للمفتاح داخل الـ Keystore.

4. **`ANDROID_KEY_PASSWORD`**:
   - كلمة المرور الخاصة بالمفتاح نفسه (Key Password).

> ⚠️ **ملاحظة أمنية:** لا تقم أبداً برفع ملف الـ Keystore الفعلي أو كلمات المرور إلى الكود المصدري أو ملفات المستودع لضمان أمان التطبيق والمستخدمين. الاعتماد الكلي يكون على حقنها من الـ `GitHub Secrets` في الـ Workflow.
