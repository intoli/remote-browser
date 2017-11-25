import FeverDreamChrome from './chrome';


export default async (options) => {
  const feverDream = new FeverDreamChrome(options);
  await feverDream.initialize();
  return feverDream;
};
