import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

const base = document.querySelector('base');

if (base) 
{
  const path = window.location.pathname.split('/')[1];

  if (path && path !== '') 
  {
    base.setAttribute('href', `/${path}/`);
  }
  
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
