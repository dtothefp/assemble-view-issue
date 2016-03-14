import assemble from 'assemble-core';
import loader from 'assemble-loader'
import utils from 'boiler-utils';
import nunjucks from 'nunjucks';
import consolidate from 'consolidate';
import fs from 'fs';
import Debug from './tags/debug';

const {renameKey} = utils;
const app = assemble();

const nunj = nunjucks.configure({
  watch: false,
  noCache: true
});

app.engine('.html', consolidate.nunjucks);
app.create('pages', {renameKey}).use(loader());

nunj.addExtension('Debug', new Debug(app));

const ctx = {
  title: 'Bleep',
  message: 'Bloop'
};

app.pages('./index.html');

const page = app.pages.getView('assemble-view-issue/index');

page.render(ctx, (err, view) => {
  if (err) throw err;

  fs.writeFileSync('compile.html', view.content);
});
