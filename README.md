# ngFluxify
ngFluxify provide a full data layer, using Redux and Flux pattern. Manages application's store state for quick, easy and efficient comsuption of APIs and other data sources. Helps to focus on application features, not on data lifecycle management.

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
@Entity(new RestEntityDescriptor({
  name: 'Article', 
  route: 'https://my-wonderful-api.dev/articles'
}))
export class ArticleEntity extends AbstractEntity {
  @EntityProperty({type: Number, primary: true})
  public id: number;
  
  @EntityProperty({type: String})
  public title: string;

  @EntityProperty({type: String})
  public content: string;  

  @EntityProperty({type: Date})
  public createdAt = new date();  
}
~~~~

**Step 2 - Get data**

~~~~
ArticleEntity.readAll<ArticleEntity>(); // Observable<ArticleEntity[]>
ArticleEntity.read<ArticleEntity>(1); // Observable<ArticleEntity>
~~~~

**Step 3 - Add new entity**

~~~~
const article = new ArticleEntity();
article.title = 'Hello';
article.content = 'World';

article.save();
~~~~
