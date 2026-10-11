# Категорії MasterQuiz: реалізація та потоки Next.js

Робота виконана у `/home/kirito/.t3/worktrees/masterquiz-frontend/feature-categories`,
гілка `feature/categories`. Первинна база — `origin/develop` (`aa0c040`);
перед створенням PR основу оновлено до `cb1f67f` після merge auth у `develop`.
Backend перевірено на `develop`, коміт `2a30955`,
`http://localhost:8080`; його код і процес не змінювалися.

## Що вже працює

- `/categories` повторно використовує наявні Header та Footer.
- На desktop 1440 px є сітка 3×4: картки 340×270, gap 40, радіус 23 px.
  Початок колонок — x170/550/930, рядів — y317/627/937/1247.
  Заголовок 609×116 починається на y139, шрифт Inter 700 48/58.
  Сірі прямокутники 152×14 починаються на y508 і y533 першого ряду.
  Divider/footer починається на y1640. Фон — `#F9FAFC`.
- На ширині до 1100 px — дві колонки, до 600 px — одна.
- До 700 px заголовок може переноситися, щоб не створювати горизонтальний
  скрол між mobile і tablet; до 600 px він використовує шрифт 32/40.
- Навігація веде Home на `/`, Categories на `/categories`; активний пункт
  визначається за поточним pathname. Фіолетове підкреслення є тільки в Header.
- Без сесії відвідувач бачить явно позначений **Design preview** із 12 назвами
  макета. Ці картки не мають ID backend і не запускають API чи квіз.
- Після входу показуються лише записи з backend: `{ id, name }`.
  Якщо записів немає, показується порожній стан; дизайн не використовується як fallback.
- Категорії читаються сторінками по 12 із сортуванням `id,asc`.
  `Previous`/`Next` використовують фактичні метадані backend.
- Вибір категорії мишею або Enter змінює URL на
  `/categories?page=0&category=1`. ID повторно перевіряється через backend.
  Вибір зберігається після reload; `Clear selection` його прибирає.
- Є стан завантаження через Suspense, помилки списку/вибору, повторний запит,
  відсутня категорія та повернення до першої сторінки для порожньої сторінки.
  Повторний запит використовує звичайне посилання, щоб справді виконати новий запит.

## Де лежить код

| Файл або каталог                                       | Відповідальність                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `src/app/categories/page.tsx`                          | Next.js маршрут, metadata, shared Header/Footer, Suspense               |
| `src/app/categories/page.module.scss`                  | Ширина main, відступи, desktop/footer geometry                          |
| `src/features/categories/components/CategoriesScreen/` | Серверне читання сесії/категорій, URL-вибір, пагінація і стани          |
| `src/features/categories/components/CategoryCard/`     | Картка, місце ілюстрації, назва та сірі прямокутники                    |
| `src/features/categories/design-preview.ts`            | 12 назв макета та мапа майбутніх локальних ілюстрацій                   |
| `src/features/categories/types.ts`                     | Category, CategoryInput, CategoryPage                                   |
| `src/features/categories/server/api.ts`                | Типізоване читання, створення, оновлення та видалення категорій         |
| `src/features/questions/types.ts`, `server/api.ts`     | Контракти і серверні операції питань, проєкція без службових полів      |
| `src/features/answers/types.ts`, `server/api.ts`       | Контракти і серверні операції відповідей, проєкція без correct          |
| `src/app/api/categories/`                              | HTTP BFF категорій                                                      |
| `src/app/api/questions/`                               | HTTP BFF питань                                                         |
| `src/app/api/answers/`                                 | HTTP BFF відповідей                                                     |
| `src/lib/api/server.ts`                                | Спільні перевірки запитів/JSON/ID, помилки та адаптація HTTP-відповідей |
| `src/components/layout/Navigation/`                    | Client Component для активного пункту навігації                         |

`app` відповідає за маршрути, `components` — спільний UI, `features` — продуктовий
код і його контракти. Один нейтральний модуль `lib/api/server.ts` потрібен трьом
features для однакових HTTP-перевірок; він не містить логіки конкретної категорії
чи квізу. SCSS Modules лежать поруч із відповідними компонентами.

Auth-код, Header та його адаптивне виправлення на 320 px синхронізовано з
`feature/auth`. Детальне пояснення цієї частини — [auth-flow.md](auth-flow.md).

## Як дані потрапляють на сторінку

У звичайному React часто пишуть `useEffect → fetch → setState`. Тут `page.tsx`
і `CategoriesScreen.tsx` — **Server Components**, тому Next.js може прочитати
дані до побудови відповідного UI. `useEffect` для завантаження списку не потрібен.

1. Браузер відкриває `/categories` і автоматично надсилає HttpOnly cookie.
2. `getSession()` перевіряє JWT через захищений
   `GET /categories?page=0&size=1`, оскільки backend ще не має `/me`.
   Header і екран використовують цей спільний auth-модуль; React `cache`
   повторно використовує його результат у межах одного серверного рендерингу.
3. Якщо сесії немає, сервер рендерить design preview. Він не створює
   анонімний ID і не пробує читати захищений каталог без авторизації.
4. За наявності сесії `getCategories()` викликає `backendRequest()`.
5. `backendRequest()` використовує спільний `backendFetch()`: він читає token
   із cookie, додає `Authorization: Bearer …`, встановлює `no-store`, timeout
   10 секунд і забороняє redirects.
6. Відповідь проходить runtime-перевірку: TypeScript сам по собі не гарантує,
   що Java API справді повернув потрібний JSON. Некоректний контракт стає 502.
7. `CategoriesScreen` рендерить картки зі справжніми ID і назвами.
   Браузер отримує HTML/RSC; JWT у props чи публічний JSON не потрапляє.

Серверна сторінка звертається **безпосередньо до Java API через серверний helper**.
Вона не викликає власний `/api/categories`, тому зайвого HTTP-кола немає.
`Navigation` має `"use client"`, бо `usePathname()` читає поточний маршрут.
Це не робить всю сторінку клієнтською.

## Як працює вибір

Картка справжньої категорії — `next/link`, а не клієнтський `useState`.
Після кліку або Enter Next.js переходить на URL із `category=<backend id>`.
Сервер читає `await searchParams`, перевіряє ID і робить `getCategory(id)`.
У відповідь приходить оновлений UI із підсвіченою карткою та вибраною назвою.
Оновлення вкладки відтворює той самий стан із URL.

Поки що це закінчується повідомленням, що quiz setup ще буде доступний.
Перехід на вигадану gameplay-сесію чи неіснуючу сторінку не реалізовано.
Вибраний ID уже можна передати майбутньому quiz setup, коли буде його API й UI.

### Hover і клавіатурний focus

У `CategoryCard.tsx` додано декоративну нижню плашку зі спільною іконкою
`Icon name="arrow"`. Це не окрема кнопка: посиланням залишається вся картка.
Плашка прихована від accessibility tree через `aria-hidden`; доступна назва
посилання походить із заголовка категорії.

- Hover на пристроях із точним вказівником: рамка 1 px
  `rgba(92,77,228,.7)` і тінь `0 4px 4px 5px rgba(92,77,228,.3)`.
- `:focus-visible` справжнього посилання: рамка 2 px `#5C4DE4`, та сама тінь
  і плашка. Якщо одночасно є hover і focus, пріоритет має focus.
- Плашка desktop має розмір 322×50, фон `#F1F0FE`, радіус 10 px;
  коло 35×35 із білою стрілкою. Вона перекриває другий сірий прямокутник,
  як у наданому макеті; перший залишається видимим.

Плашка розташована через flex і від'ємний верхній margin, без абсолютних
координат. Вона займає місце в потоці навіть у прихованому стані. Зменшення
рамки на hover компенсується padding: розміри картки й позиція заголовка
не змінюються. На вузькому екрані ширина плашки адаптується до картки.
`prefers-reduced-motion` вимикає переходи.

Hover видно також на явно позначених design preview картках. Вони залишаються
звичайними `div`: клік не викликає API, а клавіатурний Tab їх пропускає.
Focus і Enter працюють для справжніх backend-категорій після входу.

Усе це працює через CSS Modules. `useState`, обробники миші та `"use client"`
для картки не потрібні; серверний потік даних і URL-вибір залишаються тими самими.

### Спільна сітка Figma

Поточна CSS grid карток має 3/2/1 колонки відповідно до ширини екрана.
Сітка `Layout guides` у Figma — окремі візуальні напрямні всього frame;
вони не пересувають елементи макета автоматично. Тому наявність 12 колонок
сама по собі не доводить, що картки повинні заповнювати по 4 колонки.

На останньому скріні Figma видно режим перегляду `Comments / Properties`,
ширину frame 1440 px, але немає секції параметрів напрямних. Для точного
спільного SCSS mixin ще потрібні Count, Type, Gutter і Margin для Stretch,
або Width та відповідний Offset для фіксованого типу. За типу Stretch ширина
колонки обчислюється як `(frameWidth - 2 * margin - (count - 1) * gutter) / count`.
Значення не вгадувалися; перебудову всіх сторінок під непідтверджену сітку
та спільний mixin поки не виконано.

## BFF для клієнтських запитів

Якщо пізніше Client Component потребуватиме даних, він звертається на той самий
origin frontend, наприклад:

```ts
const response = await fetch("/api/categories?page=0&size=12", {
  cache: "no-store",
});
if (!response.ok) throw new Error("Categories could not be loaded");
const categories = await response.json();
```

Потік тоді такий: **браузер → Next route handler → server helper → Java API**.
Cookie надсилається браузером; `route.ts` не приймає довільний backend URL або
Bearer від клієнта. Запити змін використовують спільний `checkAuthRequest()`:
перевіряються Origin, Sec-Fetch-Site і `Content-Type: application/json`.
Вхідний JSON звужується до конкретних дозволених полів і перевіряється.
Усі BFF JSON-відповіді, включно з помилками, мають `Cache-Control: no-store`.
Backend `message` і масив текстових `errors` зберігаються у відповідях помилки.

| Next.js BFF                          | Операції/параметри                                                                         | Статус зараз                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `/api/categories`                    | GET `page`, `size` (1–100); POST `{name}`                                                  | Працює; duplicate bug див. нижче                                |
| `/api/categories/[id]`               | GET; PUT `{name}`; DELETE                                                                  | Читання/оновлення live перевірено; DELETE лише ізольованим stub |
| `/api/questions`                     | GET `categoryName`; POST `{text,feedback,categoryId}`; PUT `{id,text,feedback,categoryId}` | Список/створення працюють; PUT upstream 403                     |
| `/api/questions/[id]`                | GET; DELETE                                                                                | GET upstream 403; DELETE перевірено лише ізольованим stub       |
| `/api/answers`                       | POST `{text,correct,questionId}`; PUT `{id,text,correct}`                                  | Live створення й оновлення працюють                             |
| `/api/answers/[id]`                  | GET; DELETE                                                                                | GET працює; DELETE лише ізольованим stub                        |
| `/api/answers/question/[questionId]` | GET                                                                                        | Live працює                                                     |

`DELETE` теж проходить JSON guard: майбутній клієнт має надіслати
`Content-Type: application/json` і body `{}`. На реальній БД видалення не виконувалося.
Для create/update застосовані поточні межі DTO: category name 2–20 символів,
question text/feedback 2–30, answer text 2–10; ID — додатне ціле число.

CRUD підготовлено як інтеграційний код без адміністративних форм. Поточний
backend дозволяє ці операції `ROLE_USER`; окремого admin-контракту немає.
Ці маршрути не є API запуску гри чи надсилання відповіді гравця.

### Поля правильності відповіді

Backend повертає `QuestionRecord` із `feedback`, `answerCounter`, `correctAnswer`
і `AnswerRecord` із `correct`. Ці DTO доступні тільки через модулі з
`import "server-only"` для майбутніх серверних операцій із контентом.
Типи — лише описи даних, самі по собі вони не відправляють дані в браузер.

Перед BFF-відповіддю `toQuestion()` залишає тільки `{id,text,category}`,
а `toAnswer()` — `{id,text,questionId}`. Проєкція діє також для результатів
створення та оновлення, не лише GET. UI категорій взагалі не читає ці DTO.
Локальна перевірка `correct` для scoring гравця не реалізована.

## Ілюстрації: що потрібно додати

Ілюстрації не генерувалися і не вирізалися зі скріну. У картках зарезервовано
простір приблизно 160×150 px; точна висота слоту 145 px зберігає y464 для назви.
`next/image` використовує natural size 160×150 та `object-fit: contain`.
Поки `illustration: null`, немає image-запиту чи broken image.

Додай готові експорти в `public/images/categories/` (папка навмисно не створена
порожньою), а в `src/features/categories/design-preview.ts` заміни для відповідного
рядка `illustration: null` на `illustration: "/images/categories/geography.svg"`
або інший відповідний шлях.

| Назва             | Очікуване ім'я SVG    |
| ----------------- | --------------------- |
| Geography         | geography.svg         |
| History           | history.svg           |
| Science           | science.svg           |
| Sports            | sports.svg            |
| Entertainment     | entertainment.svg     |
| Technology        | technology.svg        |
| Art & Culture     | art-culture.svg       |
| General Knowledge | general-knowledge.svg |
| Animals           | animals.svg           |
| Music             | music.svg             |
| Food & Drinks     | food-drinks.svg       |
| Astronomy         | astronomy.svg         |

Мапа ілюстрацій застосовується до реальних категорій за збігом назви без
урахування регістру. Для інших назв слот залишиться порожнім; ID не вигадується.
Якщо backend змінить назви/локалізацію, цю мапу потрібно адаптувати.

Окремо ще потрібні два decorative accent exports — для верхнього лівого і
нижнього правого кута сітки. Орієнтовна зона кожного 55×70 px на desktop;
точні розміри й offsets варто узгодити з SVG viewBox/Figma. Очікувані назви:
`categories-accent-top-left.svg` і `categories-accent-bottom-right.svg`.
Blobs кольорів green `rgba(127,207,156,.2)`, purple `rgba(92,77,228,.2)`,
pink `rgba(228,134,225,.4)`, yellow `rgba(253,226,164,.2)` мають бути в готових
експортах ілюстрацій або окремих exports дизайнера. Довільні CSS-форми не додано.
Сірі прямокутники описів залишені як у low-fi макеті: власних описів немає.

## Що залежить від backend

Факти нижче підтверджені кодом `2a30955`, OpenAPI та живими HTTP-запитами 11.10.2026.

- Категорії містять тільки `id` і `name`: описів, image URL і кількості питань немає.
- Усі data endpoints захищені JWT; немає публічного guest-каталогу, anonymous ID,
  `/me`, refresh або gameplay/submit/scoring/result API.
- `GET /questions/{id}` і `PUT /questions` повертають **403 із валідним JWT**.
  У `QuestionController` використано некоректний `@PreAuthorize("hasRole('USER)")`.
  Helpers збережені під реальний контракт, але не приховують upstream помилку.
- `PUT /categories/{id}` ігнорує path ID та використовує body ID. Прямий HTTP
  запит на `/categories/99999999` із body ID1 оновив ID1 і повернув 200.
  BFF нормалізує body ID до перевіреного URL ID, тому клієнт не може підмінити його.
- Повторне створення наявної категорії повернуло **403 із порожнім body**, а не 409.
  У handler для `EntityFoundException` параметр має інший тип — `EntityNotFoundException`.
  Через це довільний 403 не вважається доказом простроченої сесії і не очищає cookie.
- Питання й відповіді — CRUD контенту. Вони не встановлюють ігрову сесію й не
  забезпечують серверну перевірку відповіді гравця. Для завершеного quiz flow
  потрібні окремі backend-контракти.

Jira перевірено read-only: MAS-131 In Progress; MAS-160–162 Done;
MAS-186–188 To Do; MAS-164–167 і MAS-189 To Do. Layout і data browsing реалізовано
в межах доступного API; перехід до quiz setup не завершений без його контракту.
Статуси Jira не змінювалися.

## Перевірка

Повторна перевірка hover/focus 12.10.2026:

- Lint, TypeScript, production build, форматування змінених файлів і
  `git diff --check` пройшли.
- T3 preview підтвердив hover. Після втрати з'єднання T3 та недоступності
  Browser skill перевірку завершено в окремому локальному Chromium.
- Desktop: картка x170/y317/340×270, плашка x179/y529/322×50,
  коло x458/y536/35×35. Hover не змінює розмір картки й координати заголовка.
- Реальний Tab показує focus; focus разом із hover зберігає рамку 2 px.
  Enter змінює URL і вибирає справжню категорію з backend. Помилок JavaScript немає.
- Anonymous 320 px, signed-in 320 px та 390 px: `scrollWidth` дорівнює
  ширині viewport. Logout повертає design preview.
- Перед PR виправлено переповнення заголовка через `white-space: nowrap`:
  перенесення дозволено до 700 px. Повторно перевірено 320, 390, 600, 601,
  640, 680, 700, 701, 768, 1024 і 1440 px — горизонтального переповнення немає.
- Поточний каталог перед цією перевіркою був порожнім. Через HTTP створено
  синтетичні акаунти ID2/ID3 і категорію ID1 `UI hover check`.
  Попередній перелік fixtures нижче описує аудит 11.10, а не поточне наповнення БД.
  Дані не видалялися; приватні облікові дані користувача не використовувалися.

Попередній інтеграційний аудит 11.10.2026:

- `pnpm lint`, `pnpm typecheck`, `pnpm build` — проходять зі спільними auth-модулями.
- Реальні HTTP-запити підтвердили register/login, JWT-доступ, порожню БД перед
  fixtures, читання/створення категорії, URL/body ID mismatch, duplicate403,
  створення/список питань, question GET/PUT403, створення/читання/оновлення відповідей.
- 24 перевірки BFF: HttpOnly login без token у JSON, no-store, списки/деталі,
  валідація, 404, службові поля, правильний ID оновлення, backend403 без втрати
  сесії, Origin/Sec-Fetch-Site/JSON guard. Окремо перевірено рендеринг списку,
  вибору, missing selection, invalid query та empty page.
- 27 перевірок production build з окремим upstream stub: багатосторінкова
  пагінація, CRUD forwarding, проєкції, simulated DELETE204, неправильний JSON
  і контракт502, upstream403/503, disconnect502, timeout504, збереження cookie,
  empty/error UI. У браузері окремо перевірено Loading і відновлення списку
  через Try again після upstream503. Цей stub не є джерелом даних реалізації.
- T3 preview: desktop і narrow layout, active navigation, cookie прихований від
  JavaScript, реальна категорія після входу, вибір картки, Enter і reload.
  Після синхронізації Header перевірено 320 px з авторизацією та без неї,
  390 px і 1440 px: горизонтального переповнення немає.

Для реального HTTP-аудиту залишено синтетичні записи: user ID2, категорія ID1
`MQ audit a39bd502`, question ID1, answers ID1 і ID2. Вони створені через API,
позначені як тестові; наявні записи не видалялися. Облікові дані/JWT у docs не записані.

Інсталяція `pnpm install --frozen-lockfile` встановила залежності без зміни
lockfile, але повернула `ERR_PNPM_IGNORED_BUILDS` для `@parcel/watcher`.
Build scripts не схвалювалися автоматично. Перевірки запускалися з
`pnpm --config.verifyDepsBeforeRun=false <script>`, щоб pnpm не повторював
цю саму інсталяцію перед кожним script. Lint, TypeScript, Sass і Next build працюють.

Для локального перегляду:

```sh
pnpm --config.verifyDepsBeforeRun=false dev --port 3001
```

Frontend: `http://localhost:3001/categories`. Backend URL береться тільки на
сервері з `BACKEND_API_URL`, за замовчуванням `http://localhost:8080`.
`AGENTS.md`/`CLAUDE.md`, які генерує Next dev, не додавалися до Git.
