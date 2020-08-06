from typing import List, Optional, Dict
from .source import ConfigSource


class ConfigProvider:
    """
    Configuration provider keeping the cache and sources that can be shared
    across the configuration objects
    """
    def __init__(self, sources: List[ConfigSource]=None):
        self._cache: Dict[str, Dict[str, str]] = {}
        self._config_sources: List[ConfigSource] = []
        if sources is not None:
            for s in sources:
                self.add_source(s)

    def add_to_cache(self, section_name: str, key_name: str, value) -> None:
        if section_name not in self._cache:
            self._cache[section_name] = {}
        self._cache[section_name][key_name] = value

    def get_from_cache(self, section_name: str, key_name: str):
        if section_name not in self._cache:
            return None
        return self._cache[section_name].get(key_name, None)

    def clear_cache(self) -> None:
        self._cache.clear()

    @property
    def config_sources(self) -> List[ConfigSource]:
        return self._config_sources

    def get_key(self, section_name: str, key_name: str) -> Optional[str]:
        value = None

        # Go through the config sources until we find one which supplies the requested value
        for source in self._config_sources:
            value = source.get_config_value(section_name, key_name)
            if value is not None:
                break

        return value

    def add_source(self, source: ConfigSource):
        if not isinstance(source, ConfigSource):
            raise TypeError("Sources must be subclasses of ConfigSource")
        self._config_sources.append(source)
