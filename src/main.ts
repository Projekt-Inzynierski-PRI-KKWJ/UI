import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';


// This needs to stay here, because it allows for dynamic 
// configuration of paths in production environment
const base = document.querySelector('base');

if (base) {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalhost) 
  {
    base.setAttribute('href', '/');
  } 
  else 
  {
    const segments = window.location.pathname.split('/').filter(Boolean);

    if (segments.length > 0) 
    {
      base.setAttribute('href', `/${segments[0]}/`);
    }
  }
}
// Do not delete this fragment of code above, between the comments 

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
