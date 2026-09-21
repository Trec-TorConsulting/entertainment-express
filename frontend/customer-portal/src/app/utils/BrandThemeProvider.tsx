import React, { createContext, useContext, useEffect, useState } from 'react';

export interface BrandTheme {
  name?: string;
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  logo: string;
  email_from?: string;
  twilio_phone_number?: string;
  statement_descriptor?: string;
}

const defaultTheme: BrandTheme = {
  brand_name: 'Entertainment Express',
  primary_color: '#059669',
  secondary_color: '#10b981',
  logo: '',
  statement_descriptor: 'ENTERTAINMENT',
};

const BrandThemeContext = createContext<{
  theme: BrandTheme;
  setTheme: (theme: BrandTheme) => void;
}>({
  theme: defaultTheme,
  setTheme: () => {},
});

export const BrandThemeProvider: React.FC<{ children: React.ReactNode; initialHost?: string }> = ({
  children,
  initialHost,
}) => {
  const [theme, setTheme] = useState<BrandTheme>(defaultTheme);

  useEffect(() => {
    const host = initialHost || window.location.hostname;
    fetch(`/api/method/entertainment_express.api.brand.get_brand_theme_by_host?host=${encodeURIComponent(host)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          const t = data.message;
          setTheme(t);
          document.documentElement.style.setProperty('--brand-primary', t.primary_color || '#059669');
          document.documentElement.style.setProperty('--brand-secondary', t.secondary_color || '#10b981');
        }
      })
      .catch(() => {});
  }, [initialHost]);

  return (
    <BrandThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </BrandThemeContext.Provider>
  );
};

export const useBrandTheme = () => useContext(BrandThemeContext);
export default BrandThemeProvider;
