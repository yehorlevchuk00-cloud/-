// Форма заявки клиента: поля, варианты бюджета и проверка данных.
// Проверка не зависит от React — её же можно будет вызвать на сервере,
// когда появится реальная отправка (CRM или почта).

/**
 * Пока false — форма работает в демонстрационном режиме: данные никуда не отправляются
 * и не сохраняются. Переключать только вместе с подключением реальной отправки.
 */
export const CONTACT_FORM_LIVE = false;

/** Адрес будущей политики конфиденциальности */
export const PRIVACY_POLICY_HREF = "/polityka-prywatnosci";

export type ContactValues = {
  name: string;
  phone: string;
  email: string;
  car: string;
  budget: string;
  message: string;
  consent: boolean;
};

export type ContactField = keyof ContactValues | "contact";
export type ContactErrors = Partial<Record<ContactField, string>>;

export const LIMITS = { name: 80, car: 200, message: 2000 } as const;

export const budgetOptions = [
  "do 50 000 zł",
  "50 000 – 100 000 zł",
  "100 000 – 150 000 zł",
  "150 000 – 250 000 zł",
  "powyżej 250 000 zł",
  "Jeszcze nie wiem",
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS = /^\+?[\d\s()-]+$/;

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.name.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();

  if (name.length === 0) errors.name = "Podaj imię.";
  else if (name.length < 2) errors.name = "Imię jest za krótkie.";
  else if (name.length > LIMITS.name) {
    errors.name = `Imię może mieć maksymalnie ${LIMITS.name} znaków.`;
  }

  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (!PHONE_CHARS.test(phone) || digits.length < 9 || digits.length > 15) {
      errors.phone = "Podaj poprawny numer telefonu, np. +48 600 000 000.";
    }
  }

  if (email && !EMAIL.test(email)) {
    errors.email = "Podaj poprawny adres e-mail, np. jan@przyklad.pl.";
  }

  if (!phone && !email) {
    errors.contact = "Podaj numer telefonu lub adres e-mail — przynajmniej jeden sposób kontaktu.";
  }

  if (values.car.length > LIMITS.car) {
    errors.car = `Opis samochodu może mieć maksymalnie ${LIMITS.car} znaków.`;
  }

  if (values.budget && !budgetOptions.includes(values.budget)) {
    errors.budget = "Wybierz budżet z listy.";
  }

  if (values.message.length > LIMITS.message) {
    errors.message = `Wiadomość może mieć maksymalnie ${LIMITS.message} znaków.`;
  }

  if (!values.consent) {
    errors.consent = "Zaznacz zgodę, abyśmy mogli odpowiedzieć na zapytanie.";
  }

  return errors;
}

/** Ссылка на форму с заранее выбранным автомобилем */
export const contactHref = (carSlug?: string) =>
  carSlug ? `/kontakt?samochod=${encodeURIComponent(carSlug)}` : "/kontakt";
