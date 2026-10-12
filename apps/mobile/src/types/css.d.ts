declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare var process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_OS?: string;
    [key: string]: string | undefined;
  };
};
