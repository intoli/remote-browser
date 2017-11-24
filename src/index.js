import FeverDreamFirefox from './firefox';


export default async (options) => {
  const feverDream = new FeverDreamFirefox(options);
  await feverDream.initialize();
};
