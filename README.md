# Pri

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.8.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## About Project


Modules:

    The project is divided into modules that are loaded in lazy mode.

    - Project: contains a project list with filters, project details, a grading form, an adding or editing project form, and a supervisor availability list or form.
    - Data Feed: contains file inputs used to import students (csv), supervisors (csv), and grading criteria (json), and contains buttons used to export students and grades.
     - User: contains a login form and role guards that prevent users without entitlements from accessing certain pages.
    - The defense schedule contains a coordinator's panel used to manage defense schedules, a survey form for supervisors to specify time availability, and a defense list that students use to register for a defense.

    Every module has a routing module, so routing is separated. If you want to change routing paths for project-related pages, go to./src/app/modules/project/project.routing.module.ts.

State Management:

    The application uses the NgRx and the RxJs to update the application state; most actions are related to updating a project list and the user's details. Project and User modules have state folders where actions, reducers, effects, and selectors are kept.

    The RxJs's combineLatest combination operator is used to update a project list view after changing filters's states or making changes to the list data's states.

    All Observables subscriptions are terminated after destroying components by using the takeUntil operator that waits for `unsubscribe$` subject completion.

Serving projects locally:

    When serving the project locally, every API call is made to `http://localhost:8080`, which can be changed in the file./src/proxy.config.json. Because of that, it is important to build the application when we want to use it in the production environment.

Session:

    The application uses an Access and Refresh token to keep the session after closing the browser and to authorize every call made to the backend.

UI components:

    The application uses Angular Material UI components; all modules import the required Material's modules separately.

# Local run for debug:
## 🖥️ BACKEND

1. Create a file named `application.properties` and copy the contents from `application-local.properties`.
2. Run `PriApplication` in **debug mode** or use **Run**.
3. The application should start without any issues.

> ⚠️ **WARNING:**  
> Make sure the **database is running**, and that the database address in `application.properties` is correct.

> ⚠️ **TIP (Optional Authentication Bypass):**  
> If you want to run the backend **without authentication**, set the following property:
> ```properties
> auth.enabled=false
> ```

---

## 🌐 FRONTEND

To run the frontend locally **with a non-Docker backend** (for easier debugging):

1. Use the `nginx-local.conf` configuration file.
2. With Docker installed, run the following command:
   ```bash
   docker build --build-arg NGINX_CONF=nginx-local.conf -t my-app .
   ```
3. (To build with default config)
   ```bash
   docker build --build-arg NGINX_CONF=nginx.conf -t my-app .
   ```
4. Run the container:
   ```bash
   docker run -p 80:80 my-app
   ```
5. Open in browser:
   ```
   http://localhost:80/login
   ```
6. Log in using your credentials.

---

## 🛠️ Useful Docker Commands

1. **Enter a running container:**
   ```bash
   docker exec -it <container_name> bash
   ```
 
2. **Run a CURL request inside a container:**
   ```bash
   docker exec -it <container_name> curl <your_endpoint>
   ```
