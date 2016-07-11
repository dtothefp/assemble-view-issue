import {join} from 'path';
import assemble from 'assemble-core';
import loader from 'assemble-loader'
import utils from 'boiler-utils';
import nunjucks from 'nunjucks';
import consolidate from 'consolidate';
import fs from 'fs';
import matter from 'parser-front-matter';
import Plasma from 'plasma';
import {safeLoad} from 'js-yaml';
import Debug from './tags/debug';

const {renameKey} = utils;
const app = assemble();
const plasma = new Plasma();

plasma.dataLoader('yml', function(fp) {
  const ymlStr = fs.readFileSync(fp, 'utf8');

  return safeLoad(ymlStr);
});

const nunj = nunjucks.configure({
  watch: false,
  noCache: true
});

const fns = {
  partials(fp) {
    return join('partials', `${fp}.html`);
  },
  macros(fp) {
    return join('macros', `${fp}.html`);
  }
};

Object.keys(fns).forEach(name => {
  nunj.addGlobal(name, fns[name]);
});

app.engine('.html', consolidate.nunjucks);
app.create('pages', {renameKey}).use(loader());
app.data({
  bleep: 'bleep',
  partials(fp) {
    return join('partials', `${fp}.html`);
  },
  macros(fp) {
    return join('macros', `${fp}.html`);
  }
});
app.onLoad(/\.html$/, (file, next) => {
  matter.parse(file, (err, file) => {
    if (err) return next(err);

    next(null, file);
  });
});

app.preRender(/\.html$/, (file, next) => {
  const globalData = plasma.load(
    join(process.cwd(), 'global-data.yml'),
    {namespace: true}
  );

  const pageData = plasma.load(
    join(process.cwd(), 'page-data.yml'),
    {namespace: true}
  );

  Object.assign(file.data, {
    pageData,
    globalData
  });

  next(null, file);
});

app.preCompile(/\.html$/, (file, next) => {
  file.data.view = file;
  next(null, file);
});

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
