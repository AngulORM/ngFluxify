# ngFluxify
ngFluxify provide a full data layer, using Redux and Flux pattern. Manages application's store state for quick, easy and efficient comsuption of APIs and other data sources. Helps to focus on application features, not on data lifecycle management.

## Disclaimer - Work In Progress
Behind the fact that ngFluxify is working pretty well a the moment, this library is currently in active development, it features are not fixed and things are subject to changes. **It shall not be used in production at it current state**, use it at your own risk.

We are aiming for a first pre-release in a matter of weeks before a validation period. Once we will be happy with it core functionnalities, v1 release will come.
From that we will add more and more features, you can take a look at the roadmap and contribute there : https://github.com/AngulORM/ngFluxify/issues

## Installation
`npm install --save ng-fluxify`

Add **NgFluxifyModule** in your Angular app.

~~~~
import {NgFluxifyModule} from 'ng-fluxify;

@NgModule({
  imports: [
    ...
    NgFluxifyModule,
    ...
  ],
  ...
})
export class AppModule {}
~~~~

## Example
**Step 1 - Write your entity**

~~~~
@Entity<RestEntityDescriptor>(new RestEntityDescriptor('Article', 'https://my-wonderful-api.dev/articles'))
export class ArticleEntity extends AbstractEntity {
  @EntityProperty({type: String})
  public title: string;

  @EntityProperty({type: String})
  public content: string;  
}
~~~~

**Step 2 - Get data**

~~~~
ArticleEntity.readAll(); // Observable<ArticleEntity[]>
ArticleEntity.read(1); // Observable<ArticleEntity>
~~~~

**Step 3 - Add new entity**

~~~~
const article = new ArticleEntity();
article.title = 'Hello';
article.content = 'World';

article.save();
~~~~
