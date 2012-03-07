# simeco

simeco is a economic simulator for educational purposes. Current version let the user set a company and a population and it is possible to see how some variables such as unemployed population, worker salary, savings, expenses, product price, demand, stock or production vary along time.

## NOTES

Despite the core is commented in English, currently interface is just available in Spanish.

## Installing simeco

simeco does not require installation. 

## Configuring simeco

There are two configurable options in file `simeco/js/simeco.gui.js`:

```javascript
const LANGUAGE = 'en';          // Default language (currently only Spanish 'es' or English 'en' are available)
const FAST_FORWARD_STEPS = 10;  // Number of steps when fast forwarding
```

## Running simeco

Simply open **index.html** file with an updated webrowser such as [Chrome](www.google.es/chrome/) or [Firefox](www.mozilla.org/firefox/fx/).

## Documentation

All documentation is in the source files. If I find a good document generator for Javascript, I promise to include the API documentation. 

You can find more info in the [simeco project's homepage](http://unoyunodiez.com/proyectos/simeco/).

## Version history

### 20120303 (1.1.1)

 * Translated to English
 * Spanish 'es' and English 'en' langauages available

### 20120225 (1.1)

 * Initial public release

## License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

«Copyright 2012 Salvador de la Puente & Pablo Rabanal»

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
