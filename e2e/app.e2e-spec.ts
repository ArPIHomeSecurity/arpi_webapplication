import { ArgusPage } from './app.po';

describe('argus App', () => {
  let page: ArgusPage;

  beforeEach(() => {
    page = new ArgusPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
