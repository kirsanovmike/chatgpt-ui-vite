export default {
  signIn: "Войти",
  signUp: "Регистрация",
  username: "Имя пользователя",
  password: "Пароль",
  "Username is required": "Имя пользователя обязательно",
  "Password is required": "Пароль обязателен",
  "Create your account": "Создайте аккаунт",
  createAccount: "Создать аккаунт",
  email: "Электронная почта",
  "Sign in instead": "Войти в систему",
  "Please enter your username": "Введите имя пользователя",
  "Username must be at least 4 characters": "Имя пользователя должно содержать не менее 4 символов",
  "Please enter your e-mail address": "Введите адрес электронной почты",
  "E-mail address must be valid": "Введите корректный адрес электронной почты",
  "Please enter your password": "Введите пароль",
  "Password must be at least 8 characters": "Пароль должен содержать не менее 8 символов",
  "Please confirm your password": "Подтвердите пароль",
  welcomeTo: "Добро пожаловать в",
  language: "Язык",
  setApiKey: "Установить ключ API",
  setOpenAIApiKey: "Установить ключ API OpenAI",
  openAIApiKey: "Ключ API OpenAI",
  getAKey: "Получить ключ",
  openAIModels: "Модели OpenAI",
  aboutTheModels: "О моделях",
  saveAndClose: "Сохранить и закрыть",
  pleaseSelectAtLeastOneModelDot: "Выберите хотя бы одну модель.",
  writeAMessage: "Напишите сообщение",
  frequentlyPrompts: "Список подсказок",
  addPrompt: "Добавить подсказку",
  titlePrompt: "Заголовок",
  addNewPrompt: "Добавьте новую подсказку",
  pressEnterToSendYourMessageOrShiftEnterToAddANewLine:
    "Нажмите Enter, чтобы отправить сообщение, или Shift+Enter, чтобы добавить новую строку.",
  lightMode: "Светлая",
  darkMode: "Тёмная",
  followSystem: "Системная",
  themeMode: "Тема",
  feedback: "Обратная связь",
  newConversation: "Новый чат",
  defaultConversationTitle: "Безымянный",
  clearConversations: "Очистить чаты",
  modelParameters: "Параметры модели",
  model: "Модель",
  temperature: "Температура",
  topP: "Top P",
  frequencyPenalty: "Штраф за повторяемость",
  presencePenalty: "Штраф за присутствие",
  maxTokens: "Максимум токенов",
  roles: {
    me: "Я",
    ai: "ИИ"
  },
  edit: "Редактировать",
  copy: "Копировать",
  copied: "Скопировано",
  delete: "Удалить",
  signOut: "Выход",
  settings: "Настройки",
  theme: "Тема",
  resetPassword: "Сбросить пароль",
  submit: "Отправить",
  agree: "Согласен",
  newPassword: "Новый пароль",
  currentPassword: "Текущий пароль",
  confirmPassword: "Подтвердите пароль",
  yourPasswordHasBeenReset: "Ваш пароль был сброшен",
  nowYouNeedToSignInAgain: "Теперь вам нужно снова войти",
  webSearch: "Поиск в интернете",
  webSearchDefaultPrompt: `Результаты веб-поиска:\n\n[web_results]\nТекущая дата: [current_date]\n\nИнструкции: Используя предоставленные результаты веб-поиска, напишите развернутый ответ на запрос. Обязательно цитируйте результаты, используя [[number](URL)]. Если результаты относятся к нескольким темам с одинаковым названием, напишите отдельные ответы.\nЗапрос: [query]`,
  genTitlePrompt:
    "Придумайте короткий заголовок для следующего текста, не более 10 слов.\n\nСодержание: ",
  maxTokenTips1: "Максимальная длина контекста для текущей модели составляет",
  maxTokenTips2:
    "токенов, включая длину подсказки и сгенерированного текста. «Максимум токенов» — это только длина генерируемого текста. Нужно оставить запас под подсказку, поэтому не ставьте слишком большое значение.",
  frugalMode: "Экономный режим",
  frugalModeTip:
    "Включите экономный режим: клиент не будет отправлять историю сообщений в ChatGPT, что снижает расход токенов. Если хотите, чтобы ChatGPT понимал контекст, отключите этот режим.",
  welcomeScreen: {
    introduction1: "",
    introduction2: "",
    examples: {
      title: "Примеры",
      items: [
        "Подскажи, как в Excel настроить формулу ВПР для отчёта по сделкам",
        "Объясни простыми словами, как в РФ работает механизм demand response",
        "Помоги сформулировать ценности команды, работающей по подходу Beyond Taylor"

      ]
    },
    capabilities: {
      title: "Возможности",
      items: [
        "Отвечает на русском языке, объясняя разные темы просто",
        "Помогает по текстовым задачам: письма, конспекты",
        "Подсказывает формулы, примеры расчётов по описанию вашей рабочей задачи"
      ]
    },
    limitations: {
      title: "Ограничения",
      items: [
        "ТНЭ чат может допускать ошибки. Проверяйте важную информацию",
        "Не имеет доступа к системам компании, видит только текст",
        "Работает только с текстом, без файлов и скриншотов; знания ограничены октябрём 2023 года"
      ]
    }

  }
}